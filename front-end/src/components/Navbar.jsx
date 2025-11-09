import React from "react"
import "../styles/Navbar.css"
import Logo from "./Logo";

const Navbar = () => {
  return (
    <nav className="navbar">
      
      <div className="navbar-section navbar-left">
        <h1 className="navbar-title">The Headless Mouse Jukebox</h1>
      </div>
      <Logo/>
    </nav>

  );
};

export default Navbar