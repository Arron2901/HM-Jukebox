import React, { useEffect, useState } from "react";
import { searchTracks } from "../api/spotifyAPI";
import VirtualKeyboard from "./VirtualKeyboard";
import "../styles/Search.css";

export default function Search({
  onAddTrack,
  onPlaylistSelect,
  externalQuery,
  externalResults,
  externalLoading,
  onClearExternalResults,
  showPlaylists = true,
  enableKeyboard = true,
  playlistSections = [],
}) {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showingExternal, setShowingExternal] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);

  useEffect(() => {
    // When Home injects playlist selections, reflect that in the input/results.
    if (externalResults && externalResults.length) {
      setQuery(externalQuery || "");
      setTracks(externalResults);
      setShowingExternal(true);
    }
  }, [externalResults, externalQuery]);

  useEffect(() => {
    if (!externalResults || externalResults.length === 0) {
      setShowingExternal(false);
    }
  }, [externalResults]);

  const clearExternal = () => {
    // Reset playlist-driven state so manual search feels clean.
    onClearExternalResults?.();
    setShowingExternal(false);
    setTracks([]);
    setQuery("");
  };

  const handleSearch = async (e) => {
    e.preventDefault?.();
    if (!query) return;
    clearExternal();
    try {
      setIsSearching(true);
      const result = await searchTracks(query);
      setTracks(result);
    } catch (error) {
      console.error("Search failed", error);
    } finally {
      setIsSearching(false);
      if (enableKeyboard) {
        setShowKeyboard(false);
      }
    }
  };

  // Feed the selected track back to Home and reset the UI for the next person.
  const handleAdd = (track) => {
    onAddTrack?.(track);
    setTracks([]);
    setQuery("");
    clearExternal();
  };

  // Map physical keyboard-like inputs to the search box.
  const handleKeyboardInput = (key) => {
    if (key === "Backspace") {
      setQuery((prev) => prev.slice(0, -1));
      return;
    }
    if (key === "Clear") {
      setQuery("");
      setTracks([]);
      clearExternal();
      return;
    }
    if (key === "Space") {
      setQuery((prev) => prev + " ");
      return;
    }
    if (key === "Enter") {
      handleSearch({ preventDefault: () => {} });
      return;
    }
    setQuery((prev) => `${prev}${key}`);
  };

  return (
    <div className="search-container">
      <section className="search-card">
        <h2 className="search-title">Add to the queue</h2>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for a song..."
            className="search-input"
            onFocus={() => enableKeyboard && setShowKeyboard(true)}
            onBlur={(e) => {
              if (!enableKeyboard) return;
              if (!e.relatedTarget || !e.relatedTarget.classList.contains("vk-key")) {
                setShowKeyboard(false);
              }
            }}
          />
          <button type="submit" className="search-button">
            GO
          </button>
        </form>
        {isSearching && <p className="search-status">Searching…</p>}
        {externalLoading && <p className="search-status">Loading playlist…</p>}
        {showingExternal && tracks.length > 0 && (
          <button type="button" className="search-result-clear" onClick={clearExternal}>
            Clear playlist picks
          </button>
        )}
        {!isSearching && tracks.length > 0 && (
          <ul className="search-results">
            {tracks.map((track) => (
              <li key={track.uri} className="search-result-item">
                <img src={track.album_art_url} alt={track.name} />
                <div className="search-result-text">
                  <span className="search-result-title">{track.name}</span>
                  <span className="search-result-artist">{track.artist}</span>
                </div>
                <button type="button" className="search-result-add" onClick={() => handleAdd(track)}>
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
        {enableKeyboard && showKeyboard && <VirtualKeyboard onKeyPress={handleKeyboardInput} />}
      </section>

      {/* Curated playlists behave like pre-filled searches to encourage discovery. */}
      {showPlaylists && playlistSections.map((section) => (
        <section key={section.id} className="playlist-section">
          <h3 className="playlist-heading">{section.heading}</h3>
          <div className="playlist-grid">
            {section.playlists.map((playlist) => (
              <button
                type="button"
                key={playlist.id}
                className="playlist-card"
                onClick={() => onPlaylistSelect?.(playlist.playlistId, playlist.title)}
              >
                <img
                  src={playlist.cover}
                  alt={playlist.title}
                  onError={(event) => {
                    if (playlist.fallbackCover && event.currentTarget.src !== playlist.fallbackCover) {
                      event.currentTarget.src = playlist.fallbackCover;
                    }
                  }}
                />
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
