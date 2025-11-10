import React from "react";
import MarqueeText from "./MarqueeText";
import "../styles/Playback.css";

// Converts a track duration in ms into m:ss for the UI timer badge.
const formatDuration = (ms = 0) => {
  if (!ms && ms !== 0) return "0:00";
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const placeholderImage = "https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045";

/**
 * Playback renders the large “Now Playing” card plus a peek at the next five queue items.
 */
export default function Playback({ currentTrack, queue = [], progress }) {
  const nextItems = queue.slice(0, 5);
  const position = progress?.position ?? 0;
  const duration = progress?.duration ?? currentTrack?.duration_ms ?? 0;

  return (
    <div className="playback-container">
      <h2 className="now-playing-label">Now Playing...</h2>

      {currentTrack ? (
        <img
          src={currentTrack.albumArt || placeholderImage}
          alt={currentTrack.name}
          className="now-playing-image"
        />
      ) : (
        <div className="now-playing-placeholder">Waiting for playback…</div>
      )}

      <MarqueeText as="h1" className="now-playing-song-title">
        {currentTrack?.name || "No track queued"}
      </MarqueeText>
      <div className="now-playing-meta">
        <MarqueeText as="h3" className="now-playing-song-artists">
          {currentTrack?.artists || "Add a song to kick things off"}
        </MarqueeText>
        <span className="now-playing-progress">
          {formatDuration(position)} / {formatDuration(duration)}
        </span>
      </div>

      <h1 className="up-next-label">Up Next</h1>

      <div className="playback-queue">
        {nextItems.length === 0 && <p>No songs queued. Searching will add them here.</p>}
        {nextItems.map((track) => (
          <div key={track.uri} className="playback-queue-item">
            <div className="playback-queue-item-image">
              <img src={track.albumArt || placeholderImage} alt={track.name} />
            </div>
            <div className="playback-queue-item-text">
              <MarqueeText as="h3" className="playback-queue-track-name">
                {track.name}
              </MarqueeText>
              <p>{track.artists}</p>
            </div>
            <div className="playback-queue-item-time">
              <p>{formatDuration(track.duration_ms)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
