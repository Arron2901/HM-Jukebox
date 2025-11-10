import React from "react";
import "../styles/AdminOverlay.css";

/** Simple right-side overlay for future admin controls. */
const AdminOverlay = ({
  onClose,
  isPlaying,
  volume,
  onPlayPause,
  onPrev,
  onNext,
  onVolumeChange,
}) => {

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
          <button type="button" className="admin-accent">Git Pull</button>
        </section>

        <button type="button" className="admin-close" onClick={onClose}>
          Close
        </button>
      </div>
    </aside>
  );
};


export default AdminOverlay;
