import React, { useState } from "react";
import { searchTracks } from "../api/spotifyAPI";
import "../styles/Search.css";

// Temporary playlist tiles mirror the touchscreen mock until Spotify endpoints power the shelves.
const playlistSections = [
  {
    id: "eras",
    heading: "Playlists from the Eras",
    playlists: [
      {
        id: "80s",
        cover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da847bb2e74941cc0a2532798f6d",
      },
      {
        id: "all-out-90s",
        cover: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da84dd8afedcc17fc2fbc9b50032",
      },
      {
        id: "all-out-00s",
        cover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da8467629902bf10d09d5ee1098f",
      },
    ],
  },
  {
    id: "genres",
    heading: "Playlists from the Genres",
    playlists: [
      {
        id: "pop-mix",
        cover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da849b4db9b8b7a5211d4fee342d",
      },
      {
        id: "rock-mix",
        cover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84c37f54cb119274d11490b021",
      },
      {
        id: "musical-mix",
        cover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84f9b1517d2cfaa53c8bf7a371",
      },
    ],
  },
];

export default function Search({ playTrack }) {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    const result = await searchTracks(query);
    setTracks(result);
  };

  return (
    <div className="search-container">
      {/* Primary search hero mirrors the touchscreen mock's input + GO combo */}
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
      </section>

      {/* Static playlist shelves placeholder for upcoming Spotify-powered rows */}
      {playlistSections.map((section) => (
        <section key={section.id} className="playlist-section">
          <h3 className="playlist-heading">{section.heading}</h3>
          <div className="playlist-grid">
            {section.playlists.map((playlist) => (
              <button type="button" key={playlist.id} className="playlist-card">
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
