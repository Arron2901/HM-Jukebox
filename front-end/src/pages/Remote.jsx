import React, { useState } from "react";
import Search from "../components/Search";
import { submitRemoteTrack } from "../api/spotifyAPI";
import "../App.css";

/**
 * Remote control page for mobile guests: lets them search and queue songs without Spotify auth.
 */
export default function Remote() {
  const [statusMessage, setStatusMessage] = useState("");

  const handleAdd = async (track) => {
    try {
      await submitRemoteTrack({
        name: track.name,
        artist: track.artist,
        uri: track.uri,
        album: track.album,
        album_art_url: track.album_art_url,
        duration_ms: track.duration_ms,
      });
      setStatusMessage(`Queued "${track.name}"`);
    } catch (error) {
      console.error("Remote add failed", error);
      setStatusMessage("Failed to queue track. Try again.");
    }
  };

  return (
    <div className="remote-page">
      <header className="remote-header">
        <h1>HM Jukebox Remote</h1>
        <p>Search for a song and add it to the party playlist.</p>
      </header>
      {statusMessage && <p className="remote-status">{statusMessage}</p>}
      <Search onAddTrack={handleAdd} showPlaylists={false} enableKeyboard={false} />
    </div>
  );
}
