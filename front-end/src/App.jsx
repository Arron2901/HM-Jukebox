import React, { useEffect, useState, useRef, useCallback } from "react";
import Login from "./pages/Login";
import Home from "./pages/home";
import Remote from "./pages/Remote";
import { BACKEND_URL } from "./api/spotifyAPI";

const sanitizeRemoteBase = (raw) => {
  if (!raw) return "";
  let trimmed = raw.trim();
  if (!trimmed) return "";
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1);
  }
  return trimmed.replace(/\/+$/, "");
};

const REMOTE_BASE_URL = sanitizeRemoteBase(import.meta.env.VITE_REMOTE_HOST);
const REMOTE_ENABLED = Boolean(REMOTE_BASE_URL);

const REFRESH_BACKOFF_MS = 15000;
const PROACTIVE_REFRESH_INTERVAL_MIN =
  Number(import.meta.env.VITE_REFRESH_INTERVAL_MIN ?? 20); // debug available; set to 20 for production
const PROACTIVE_REFRESH_INTERVAL_MS = PROACTIVE_REFRESH_INTERVAL_MIN * 60 * 1000;
const HEARTBEAT_INTERVAL_MIN = Math.min(
  Number(import.meta.env.VITE_REFRESH_HEARTBEAT_MIN ?? 5),
  PROACTIVE_REFRESH_INTERVAL_MIN
);
const HEARTBEAT_INTERVAL_MS = HEARTBEAT_INTERVAL_MIN * 60 * 1000;

const withAuthRetry = async (callback, onAuthFailure) => {
  const response = await callback();
  if (response?.status === 401) {
    await onAuthFailure?.();
  }
  return response;
};

/**
 * App bootstraps auth, keeps the browser token refreshed,
 * and switches between Login and the authenticated Home view.
 */
function App() {
  // token: current Spotify access token; refreshTimeout keeps handle to the scheduled refresh.
  const [token, setToken] = useState(null);
  const [tokenExpiresAt, setTokenExpiresAt] = useState(0);
  const [isRemoteClient, setIsRemoteClient] = useState(false);
  const refreshTimeout = useRef(null);
  const proactiveIntervalRef = useRef(null);
  const heartbeatIntervalRef = useRef(null);
  const heartbeatElapsedRef = useRef(0);

  /**
   * Calls the backend refresh endpoint and updates local token state.
   * Returns the reported expires_in so we can reschedule another refresh.
   */
  const refreshAccessToken = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/spotify/refresh-token`, { method: "POST" });
      if (res.status === 401 || res.status === 403) {
        console.error("Refresh token rejected (401/403); forcing logout");
        setToken(null);
        setTokenExpiresAt(0);
        return null;
      }
      const data = await res.json();
      if (data?.access_token) {
        const expiresIn = data.expires_in || 3600;
        setToken(data.access_token);
        setTokenExpiresAt(Date.now() + expiresIn * 1000);
        console.log(
          "[Auth] Refreshed Spotify token. Expires in",
          expiresIn,
          "seconds"
        );
        return expiresIn;
      }
      console.error("Failed to refresh Spotify token", data);
    } catch (error) {
      console.error("Error refreshing token", error);
    }
    return null;
  }, []);

  /**
   * Schedules the next silent refresh so the browser never ends up with an expired token.
   */
  const scheduleRefresh = useCallback(
    (expiresIn = 3600) => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      const refreshInMs = Math.max(0, (expiresIn - 60) * 1000);
      refreshTimeout.current = setTimeout(async () => {
        const next = await refreshAccessToken();
        if (next) {
          scheduleRefresh(next);
        } else {
          console.warn("Token refresh failed; retrying in 15 seconds");
          refreshTimeout.current = setTimeout(scheduleRefresh, REFRESH_BACKOFF_MS);
        }
      }, refreshInMs);
    },
    [refreshAccessToken]
  );

  /**
   * Manual refresh hook wired to the Admin panel button.
   * Keeps the same scheduling logic as the automatic flow.
   */
  const handleManualRefresh = useCallback(async () => {
    console.log("[Auth] Manual refresh requested");
    const next = await refreshAccessToken();
    if (next) {
      console.log("[Auth] Manual refresh succeeded; scheduling next cycle");
      scheduleRefresh(next);
      heartbeatElapsedRef.current = 0;
      return true;
    }
    console.warn("[Auth] Manual refresh failed; retry scheduled");
    refreshTimeout.current = setTimeout(scheduleRefresh, REFRESH_BACKOFF_MS);
    return false;
  }, [refreshAccessToken, scheduleRefresh]);

  const handleAuthFailure = useCallback(async () => {
    const success = await handleManualRefresh();
    if (!success) {
      setToken(null);
      setTokenExpiresAt(0);
    }
    return success;
  }, [handleManualRefresh]);

  const ensureFreshToken = useCallback(() => {
    if (!tokenExpiresAt || Date.now() < tokenExpiresAt - 60000) {
      return;
    }
    handleManualRefresh();
  }, [tokenExpiresAt, handleManualRefresh]);

  useEffect(() => {
    const remote = window.location.pathname.startsWith("/remote");
    setIsRemoteClient(remote);
    if (remote) {
      return () => {
        if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
      };
    }

    // Parse the auth callback parameters immediately after login.
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    if (accessToken) {
      setToken(accessToken);
      const expiresIn = Number(params.get("expires_in")) || 3600;
      setTokenExpiresAt(Date.now() + expiresIn * 1000);
      scheduleRefresh();
      window.history.replaceState({}, document.title, "/");
    }
    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, [scheduleRefresh]);

  useEffect(() => {
    window.addEventListener("focus", ensureFreshToken);
    document.addEventListener("visibilitychange", ensureFreshToken);
    return () => {
      window.removeEventListener("focus", ensureFreshToken);
      document.removeEventListener("visibilitychange", ensureFreshToken);
    };
  }, [ensureFreshToken]);

  useEffect(() => {
    if (!token) return;
    console.log("[Auth] Frontend now using access token (truncated):", `${token.slice(0, 10)}...`);
  }, [token]);

  useEffect(() => {
    if (isRemoteClient || !token) {
      if (proactiveIntervalRef.current) {
        clearInterval(proactiveIntervalRef.current);
        proactiveIntervalRef.current = null;
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
      return;
    }

    if (proactiveIntervalRef.current) {
      clearInterval(proactiveIntervalRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }

    heartbeatElapsedRef.current = 0;
    console.log(
      `[Auth] Starting proactive refresh interval (${PROACTIVE_REFRESH_INTERVAL_MIN} min) with heartbeat every ${HEARTBEAT_INTERVAL_MIN} min`
    );

    if (HEARTBEAT_INTERVAL_MS > 0) {
      heartbeatIntervalRef.current = setInterval(() => {
        heartbeatElapsedRef.current += HEARTBEAT_INTERVAL_MS;
        console.log(
          `[Auth] Refresh heartbeat: ${Math.round(
            heartbeatElapsedRef.current / 60000
          )} min elapsed / ${PROACTIVE_REFRESH_INTERVAL_MIN} min window`
        );
      }, HEARTBEAT_INTERVAL_MS);
    }

    proactiveIntervalRef.current = setInterval(() => {
      console.log("[Auth] Proactive refresh tick fired");
      heartbeatElapsedRef.current = 0;
      handleManualRefresh();
    }, PROACTIVE_REFRESH_INTERVAL_MS);

    return () => {
      if (proactiveIntervalRef.current) {
        clearInterval(proactiveIntervalRef.current);
        proactiveIntervalRef.current = null;
      }
      if (heartbeatIntervalRef.current) {
        clearInterval(heartbeatIntervalRef.current);
        heartbeatIntervalRef.current = null;
      }
    };
  }, [isRemoteClient, token, handleManualRefresh]);

  return (
    <div>
      {isRemoteClient ? (
        REMOTE_ENABLED ? (
          <Remote />
        ) : (
          <div className="remote-page">
            <header className="remote-header">
              <h1>Remote access disabled</h1>
              <p>Ask the host to run the kiosk script so a LAN address can be shared.</p>
            </header>
          </div>
        )
      ) : !token ? (
        <Login />
      ) : (
        <Home
          token={token}
          onManualRefreshToken={handleManualRefresh}
          onAuthFailure={handleAuthFailure}
        />
      )}
    </div>
  );
}

export default App;
