import React, { useState } from "react";
import MarqueeText from "./MarqueeText";
import "../styles/Playback.css";

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
        <div className="playback-container">
            <h2 className="now-playing-label">Now Playing...</h2>

            <img src="https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045" alt="" className="now-playing-image"/>
            
            <MarqueeText as="h1" className="now-playing-song-title">
              Revenge Revenge Revengeddddddddddddd
            </MarqueeText>
            <h1 as="h3" className="now-playing-song-artists"><MarqueeText>Captainsparklez, Tryhardninja, Captainsparklez</MarqueeText></h1>

            <h1 className="up-next-label">Up Next</h1>

            <div className="playback-queue">
                <div className="playback-queue-item">
                    <div className="playback-queue-item-image">
                        <img src="https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045" alt=""/>
                    </div>
                    <div className="playback-queue-item-text">
                        <MarqueeText as="h3" className="playback-queue-track-name">
                          Life is a highway and also a really long piece of text
                        </MarqueeText>
                        <p>Forrest, Valentino</p>
                    </div>
                    <div className="playback-queue-item-time">
                        <p>3:12</p>
                    </div>
                </div>

                <div className="playback-queue-item">
                    <div className="playback-queue-item-image">
                        <img src="https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045" alt=""/>
                    </div>
                    <div className="playback-queue-item-text">
                        <MarqueeText as="h3" className="playback-queue-track-name">
                          Gods Plan
                        </MarqueeText>
                        <p>Drake</p>
                    </div>
                    <div className="playback-queue-item-time">
                        <p>3:12</p>
                    </div>
                </div>

                <div className="playback-queue-item">
                    <div className="playback-queue-item-image">
                        <img src="https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045" alt=""/>
                    </div>
                    <div className="playback-queue-item-text">
                        <MarqueeText as="h3" className="playback-queue-track-name">
                          Hawk Tuah
                        </MarqueeText>
                        <p>Hawk Tuah Girl</p>
                    </div>
                    <div className="playback-queue-item-time">
                        <p>3:12</p>
                    </div>
                </div>

                <div className="playback-queue-item">
                    <div className="playback-queue-item-image">
                        <img src="https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045" alt=""/>
                    </div>
                    <div className="playback-queue-item-text">
                        <MarqueeText as="h3" className="playback-queue-track-name">
                          Fat Forrest
                        </MarqueeText>
                        <p>Julie</p>
                    </div>
                    <div className="playback-queue-item-time">
                        <p>3:12</p>
                    </div>
                </div>

                <div className="playback-queue-item">
                    <div className="playback-queue-item-image">
                        <img src="https://i.scdn.co/image/ab67616d0000b2735bde2cf3db31145f11ffc045" alt=""/>
                    </div>
                    <div className="playback-queue-item-text">
                        <MarqueeText as="h3" className="playback-queue-track-name">
                          Fat Valentino
                        </MarqueeText>
                        <p>Julie</p>
                    </div>
                    <div className="playback-queue-item-time">
                        <p>3:12</p>
                    </div>
                </div>
            </div>
        
        </div>
  );
}
