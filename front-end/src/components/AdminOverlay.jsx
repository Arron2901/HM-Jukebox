import React from "react";
import "../styles/AdminOverlay.css";

/**
 * Slide-in admin menu that exposes playback controls, volume, and maintenance tasks.
 * Designed for the kiosk’s secret long-press gesture on the logo.
 */
const AdminOverlay = ({
  onClose,
  isPlaying,
  volume,
  onPlayPause,
  onPrev,
  onNext,
  onVolumeChange,
  onRefreshToken,
}) => {
  // Sends a signal to the helper extension so Chrome brings the AutoDarts tab forward (or opens it).
  const handleOpenAutodarts = () => {
    if (typeof window === "undefined") return;
    window.postMessage({ source: "HM_JUKEBOX_ADMIN", type: "OPEN_AUTODARTS" }, "*");
  };

  const handleHardReload = () => {
    if (typeof window === "undefined") return;
    window.location.reload();
  };

  return (
    <aside className="admin-overlay">
      <div className="admin-panel">
        <h2>Admin Settings</h2>

        <section className="admin-section">
          <h3>Playback Controls</h3>
          <div className="admin-playback-buttons">
            <button type="button" onClick={onPrev}>⏮</button>
            <button type="button" onClick={onPlayPause}>{isPlaying ? "⏸" : "▶"}</button>
            <button type="button" onClick={onNext}>⏭</button>
          </div>
        </section>

        <section className="admin-section">
          <h3>Volume Control</h3>
          <div className="admin-volume">
            <input
              id="volume_slider"
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(event) => onVolumeChange?.(Number(event.target.value))}
            />
            <p><span id="volume_value">{volume}</span></p>
          </div>
        </section>

        <section className="admin-section">
          <h3>Advanced Control</h3>
          <div className="admin-advanced-buttons">
            <button type="button" className="admin-accent">Git Pull</button>
            <button type="button" className="admin-accent" onClick={onRefreshToken}>
              Refresh Spotify Token
            </button>
            <button type="button" className="admin-accent" onClick={handleOpenAutodarts}>
              Open AutoDarts
            </button>
            <button type="button" className="admin-accent" onClick={handleHardReload}>
              Reload Kiosk
            </button>
          </div>
        </section>

        <button type="button" className="admin-close" onClick={onClose}>
          Close
        </button>
      </div>
    </aside>
  );
};


export default AdminOverlay;
