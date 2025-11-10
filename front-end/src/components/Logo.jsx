import React, { useRef } from "react";
import logo from "../assets/hm-logo.png";

const HOLD_DURATION = 500; // Minimum press length (ms) before triggering the Admin overlay.

/**
 * Logo doubles as the “long press to open Admin” affordance.
 * Handles both mouse and touch inputs so the touchscreen kiosk works reliably.
 */
const Logo = ({ onHold }) => {
  const timerRef = useRef(null);

  // Start the timer any time a press begins; cancel if the user lets go early.
  const startHold = () => {
    if (!onHold) return;
    clearHold();
    timerRef.current = setTimeout(() => {
      onHold();
      timerRef.current = null;
    }, HOLD_DURATION);
  };

  // Centralized cleanup helper so we never leak timers between gesture types.
  const clearHold = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  return (
    <img
      src={logo}
      alt="Headless Mouse Logo"
      className="navbar-logo"
      onMouseDown={startHold}
      onMouseUp={clearHold}
      onMouseLeave={clearHold}
      onTouchStart={(event) => {
        event.preventDefault();
        startHold();
      }}
      onTouchEnd={clearHold}
      onTouchCancel={clearHold}
    />
  );
};

export default Logo;
