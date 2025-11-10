import React, { useEffect, useState, useRef, useCallback } from "react";
import Login from "./pages/Login";
import Home from "./pages/home";
import Remote from "./pages/Remote";
import { BACKEND_URL } from "./api/spotifyAPI";

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
    if (remote) return;

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
        <Remote />
      ) : !token ? (
        <Login />
      ) : (
        <Home token={token} onManualRefreshToken={handleManualRefresh} />
      )}
    </div>
  );
}

export default App;
