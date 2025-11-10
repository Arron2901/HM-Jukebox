import React, { useState } from "react";
import "../styles/AdminOverlay.css";
import { git_pull } from "../api/spotifyAPI";

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
  
  const [isPullingGit, setIsPullingGit] = useState(false)
  const [gitUpdateMessage, setGitUpdateMessage] = useState("")

  const handleGitPull = async () => {
    setIsPullingGit(true)
    setGitUpdateMessage("Pulling updates from Git...")

    try {
      const response = await git_pull()

      setGitUpdateMessage(response.message + "\n\n" + response.git_output)
    } catch (error) {
      setGitUpdateMessage(`Error: ${error.message}`)
    } finally {
      setIsPullingGit(false)
    }
  }

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
    <div className="modal-background" onClick={onClose}>
    <div className="admin-overlay" onClick={(e) => e.stopPropagation()}>
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
            <button type="button" className="admin-accent" onClick={handleGitPull} disabled={isPullingGit}>{isPullingGit? "Pulling..." : "Git Pull"}</button>
            {gitUpdateMessage && (
              <pre style={{
                marginTop: "15px",
                textAlign: "left",
                background: '#f4f4f4',
                padding: "10px",
                borderRadius: "8px",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all"
              }}>
                {gitUpdateMessage}
              </pre>
            )}
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
    </div>
    </div>
  );
};


export default AdminOverlay;
