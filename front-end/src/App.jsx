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

/**
 * App bootstraps auth, keeps the browser token refreshed,
 * and switches between Login and the authenticated Home view.
 */
function App() {
  // token: current Spotify access token; refreshTimeout keeps handle to the scheduled refresh.
  const [token, setToken] = useState(null);
  const [isRemoteClient, setIsRemoteClient] = useState(false);
  const refreshTimeout = useRef(null);

  /**
   * Calls the backend refresh endpoint and updates local token state.
   * Returns the reported expires_in so we can reschedule another refresh.
   */
  const refreshAccessToken = useCallback(async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/spotify/refresh-token`, { method: "POST" });
      const data = await res.json();
      if (data?.access_token) {
        setToken(data.access_token);
        return data.expires_in || 3600;
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
    const next = await refreshAccessToken();
    if (next) {
      scheduleRefresh(next);
    }
  }, [refreshAccessToken, scheduleRefresh]);

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
      scheduleRefresh();
      window.history.replaceState({}, document.title, "/");
    }
    return () => {
      if (refreshTimeout.current) clearTimeout(refreshTimeout.current);
    };
  }, [scheduleRefresh]);

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
        <Home token={token} onManualRefreshToken={handleManualRefresh} />
      )}
    </div>
  );
}

export default App;
