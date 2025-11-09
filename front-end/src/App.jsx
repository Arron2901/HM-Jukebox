import React, { useEffect, useState } from "react";
import Login from "./pages/Login"
import Home from "./pages/home";


function App() {
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Grab the access token from the URL query string
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access_token");
    if (accessToken) {
      setToken(accessToken);
      window.history.replaceState({}, document.title, "/"); // Clean the URL
    }
  }, []);

  return (
    <div>
      {!token ? <Login /> : <Home token={token} />}
    </div>
  );
}

export default App;
