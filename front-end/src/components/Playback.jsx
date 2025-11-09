import React, { useState } from "react";
import "../styles/Playback.css"

export default function Playback() {
  const [query, setQuery] = useState("");
  const [tracks, setTracks] = useState([]);


  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query) return;
    const result = await searchTracks(query);
    setTracks(result);
  };

  return (
    <div>
        <div className="playback-container">
            <h2 className="now-playing-label">Now Playing...</h2>

            <img src="https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045" alt="" className="now-playing-image"/>
            
            <h1 className="now-playing-song-title">Revenge Revenge Revengeddddddddddddd</h1>
            <h1 className="now-playing-song-artists">Captainsparklez, Tryhardninja, Captainsparklez</h1>

            <h1 className="up-next-label">Up Next</h1>

            <div className="queue-container">
                <div className="queue-item">
                    <div className="queue-item-image">
                        <img src="https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045" alt=""/>
                    </div>
                    <div className="queue-item-text">
                        <h3>Life is a highway</h3>
                        <p>Forrest, Valentino</p>
                    </div>
                    <div className="queue-item-time">
                        <p>3:12</p>
                    </div>
                </div>

                <div className="queue-item">
                    <div className="queue-item-image">
                        <img src="https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045" alt=""/>
                    </div>
                    <div className="queue-item-text">
                        <h3>Gods Plan</h3>
                        <p>Drake</p>
                    </div>
                    <div className="queue-item-time">
                        <p>3:12</p>
                    </div>
                </div>

                <div className="queue-item">
                    <div className="queue-item-image">
                        <img src="https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045" alt=""/>
                    </div>
                    <div className="queue-item-text">
                        <h3>Hawk Tuah</h3>
                        <p>Hawk Tuah Girl</p>
                    </div>
                    <div className="queue-item-time">
                        <p>3:12</p>
                    </div>
                </div>

                <div className="queue-item">
                    <div className="queue-item-image">
                        <img src="https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045" alt=""/>
                    </div>
                    <div className="queue-item-text">
                        <h3>Fat Forrest</h3>
                        <p>Julie</p>
                    </div>
                    <div className="queue-item-time">
                        <p>3:12</p>
                    </div>
                </div>

                <div className="queue-item">
                    <div className="queue-item-image">
                        <img src="https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045" alt=""/>
                    </div>
                    <div className="queue-item-text">
                        <h3>Fat Valentino</h3>
                        <p>Julie</p>
                    </div>
                    <div className="queue-item-time">
                        <p>3:12</p>
                    </div>
                </div>
            </div>
        
        </div>
    </div>
  );
}