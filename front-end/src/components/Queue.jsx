import React, { useState, useEffect } from "react";
import { fetchQueue, deleteFromQueue } from "../api/spotifyAPI"; 
import "../styles/Queue.css"; // Make sure to use this CSS file

const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

export default function Queue() {
    const [queueTracks, setQueueTracks] = useState([]);

    useEffect(() => {
        const loadQueue = async () => {
            try {
                const data = await fetchQueue(); 
                console.log(data)
                setQueueTracks(data); 
            } catch (error) {
                console.error("Failed to fetch queue:", error);
            }
        };

        loadQueue();
    }, []);

    
    const handleDeleteTrack = async (trackUriToDelete) => {
        try {
            await deleteFromQueue(trackUriToDelete);
            
            const newQueue = queueTracks.filter((track) => track.uri !== trackUriToDelete);
            setQueueTracks(newQueue); 

        } catch (error) {
            console.error("Failed to delete track:", error);
        }
    };


    return (
        <div className="queue-container card">
            <h2 className="queue-title">Queue</h2>            
            <ul className="queue-list"> 
                {queueTracks.length > 0 ? (
                    queueTracks.map((track) => (
                        <li key={track.uri} className="queue-track-item">
                            
                            <div className="track-item-left">
                                <img 
                                    src={track.album_art_url} 
                                    alt={track.name} 
                                    className="track-thumbnail" 
                                />
                                <div className="track-info">
                                    <strong className="track-name">{track.name}</strong>
                                    <span className="track-artist">{track.artist}</span>
                                </div>
                            </div>

                            <div className="track-item-right">
                                <span className="track-duration">
                                    {formatDuration(track.duration_ms)}
                                </span>
                            </div>

                        </li> 
                    ))
                ) : (
                    <p>Your queue is empty.</p>
                )}
            </ul>
        </div>
    );
}