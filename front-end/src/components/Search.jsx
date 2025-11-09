import React, { useState } from "react";
import { searchTracks } from "../api/spotifyAPI";
import "../styles/Search.css"

const OPTIONS = {}
const SLIDE_COUNT = 10
const SLIDES = Array.from(Array(SLIDE_COUNT).keys())
console.log(SLIDES)

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
    <div className="search-container card">
      <form onSubmit={handleSearch} className="search-form">
        <h1 className="search-title">Add to Queue</h1>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Song name"
          className="search-input"
        />
        <button type="submit" className="search-button">Search</button>
      </form>
      
      <div>
      </div>
    </div>
  );
}