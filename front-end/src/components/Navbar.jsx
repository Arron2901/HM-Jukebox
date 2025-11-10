import React, { useMemo } from "react"
import { QRCodeCanvas } from "qrcode.react";
import "../styles/Navbar.css"
import Logo from "./Logo";

const sanitizeRemoteHost = (raw) => {
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

/**
 * Simple top bar that shows the kiosk title and hosts the long-press Admin affordance.
 */
const Navbar = ({ onAdminTrigger }) => {
  const remoteUrl = useMemo(() => {
    const base = sanitizeRemoteHost(import.meta.env.VITE_REMOTE_HOST);
    if (!base) return "";
    return `${base}/remote`;
  }, []);

  return (
    <nav className="navbar">
      <div className="navbar-section navbar-left">
        <h1 className="navbar-title">The Headless Mouse Jukebox 1</h1>
      </div>
      <div className="navbar-section navbar-right">
        {remoteUrl && (
          <div className="remote-qr-block">
            <QRCodeCanvas value={remoteUrl} size={96} bgColor="#ffffff" fgColor="#111111" includeMargin />
            <span className="remote-qr-label">Scan to add songs</span>
            <a className="remote-qr-link" href={remoteUrl} target="_blank" rel="noreferrer">
              {remoteUrl}
            </a>
          </div>
        )}
        <Logo onHold={onAdminTrigger}/>
      </div>
    </nav>

  );
};

export default Navbar
