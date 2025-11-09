import React, { useState } from "react";
import SpotifyPlayer from "../components/spotifyPlayer";
import Search from "../components/Search"; 
import AnimatedBackground from "../components/AnimatedBackground";
import Playback from "../components/Playback";
import Navbar from "../components/Navbar";
import "../App.css"

import '@fontsource/roboto-mono';

import '@fontsource/roboto-mono/400.css';
import '@fontsource/roboto-mono/700.css';
import '@fontsource/roboto-mono/400-italic.css';


export default function Home({ token }) {
  const [deviceId, setDeviceId] = useState(null);
  const [featuredPlaylists, setFeaturedPlaylists] = useState([])

  const checkDeviceStatus = () => {
    if (!deviceId) {
      alert("Player is not ready yet")
      return;
    }
  }

  const playTrack = async (uri) => {
    checkDeviceStatus()

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      body: JSON.stringify({ uris: [uri] }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
  };


  return (
    <div>
      <main className="main-content">
        <Navbar />
        <div className="content-body">
          <div className="container">
            <Playback/>
            <Search playTrack={playTrack}/>
          </div>
        </div>
      </main>
      <SpotifyPlayer token={token} onReady={setDeviceId} />
      <AnimatedBackground/>
    </div>
  );
}
