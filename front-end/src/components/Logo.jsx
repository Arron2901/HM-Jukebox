import React, { useRef } from "react";
import logo from "../assets/hm-logo.png";

const HOLD_DURATION = 500;

const Logo = ({ onHold }) => {
  const timerRef = useRef(null);

  const startHold = () => {
    if (!onHold) return;
    clearHold();
    timerRef.current = setTimeout(() => {
      onHold();
      timerRef.current = null;
    }, HOLD_DURATION);
  };

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
