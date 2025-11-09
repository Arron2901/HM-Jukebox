import React from "react";

export default function Login() {
  const login = () => {
    // Redirect user to the backend login route
    window.location.href = "http://127.0.0.1:8000/spotify/login";
  };

  return (
    <div>
      <h1>HM Jukebox</h1>
      <button onClick={login}>Login with Spotify</button>
    </div>
  );
}
