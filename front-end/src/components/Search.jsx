import React, { useEffect, useState } from "react";
import { searchTracks } from "../api/spotifyAPI";
import "../styles/Search.css";

const playlistSections = [
  {
    id: "eras",
    heading: "Playlists from the Eras",
    playlists: [
      {
        id: "80s",
        title: "80s Hits",
        cover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da847bb2e74941cc0a2532798f6d",
        playlistId: "3MirNEFoRiSgd6atQrQ4eW",
      },
      {
        id: "all-out-90s",
        title: "All Out 90s",
        cover: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da84dd8afedcc17fc2fbc9b50032",
        playlistId: "4Yq0M74gg8oYQh16o8ve8Y",
      },
      {
        id: "all-out-00s",
        title: "All Out 00s",
        cover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da8467629902bf10d09d5ee1098f",
        playlistId: "5nkn4PuVCtfMztJADQ0uR9",
      },
    ],
  },
  {
    id: "genres",
    heading: "Playlists from the Genres",
    playlists: [
      {
        id: "pop-mix",
        title: "Pop Mix",
        cover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da849b4db9b8b7a5211d4fee342d",
        playlistId: "0iGaX1GZgca1EO7Tsjicln",
      },
      {
        id: "rock-mix",
        title: "Rock Mix",
        cover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84c37f54cb119274d11490b021",
        playlistId: "3tx8h1aph7mrx0HzDbC9b2",
      },
      {
        id: "musical-mix",
        title: "Musical Mix",
        cover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84f9b1517d2cfaa53c8bf7a371",
        playlistId: "6KfbVFomPKKQWfGpc1O1mA",
      },
    ],
  },
];

export default function Search({
  onAddTrack,
  onPlaylistSelect,
  externalQuery,
  externalResults,
  externalLoading,
  onClearExternalResults,
}) {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showingExternal, setShowingExternal] = useState(false);

  useEffect(() => {
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
    onClearExternalResults?.();
    setShowingExternal(false);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
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
    }
  };

  const handleAdd = (track) => {
    onAddTrack?.(track);
    setTracks([]);
    setQuery("");
    clearExternal();
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
      </section>

      {playlistSections.map((section) => (
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
                <img src={playlist.cover} alt={playlist.title} />
                <span>{playlist.title}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
