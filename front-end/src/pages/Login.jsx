import React from "react";

/**
 * Minimal landing screen used before Spotify auth is granted.
 * All heavy lifting happens on the backend login endpoint.
 */
export default function Login() {
  const login = () => {
    window.location.href = "http://127.0.0.1:8000/spotify/login";
  };

  return (
    <div>
      <h1>HM Jukebox</h1>
      <button onClick={login}>Login with Spotify</button>
    </div>
  );
}
