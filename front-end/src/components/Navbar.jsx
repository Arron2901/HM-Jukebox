import React from "react"
import "../styles/Navbar.css"
import Logo from "./Logo";

/**
 * Simple top bar that shows the kiosk title and hosts the long-press Admin affordance.
 */
const Navbar = ({ onAdminTrigger }) => {
  return (
    <nav className="navbar">
      <div className="navbar-section navbar-left">
        <h1 className="navbar-title">The Headless Mouse Jukebox</h1>
      </div>
      <Logo onHold={onAdminTrigger}/>
    </nav>

  );
};

export default Navbar
