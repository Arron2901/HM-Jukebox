import { useEffect, useState } from "react";

export default function SpotifyPlayer({ token, onReady }) {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!token) return;

    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);

    window.onSpotifyWebPlaybackSDKReady = () => {
      const playerInstance = new Spotify.Player({
        name: "HM Jukebox",
        getOAuthToken: (cb) => cb(token),
        volume: 0.8,
      });

      playerInstance.addListener("ready", ({ device_id }) => {
        setDeviceId(device_id);
        setIsReady(true);
        console.log("Spotify Player ready with device ID:", device_id);

        // Notify parent component
        if (onReady) {
          onReady(device_id);
        }
      });

      playerInstance.addListener("not_ready", ({ device_id }) => {
        setDeviceId(device_id);
        setIsReady(false);
        console.log("Device went offline:", device_id);
      });

      playerInstance.connect();
      setPlayer(playerInstance);
    };
  }, [token]);
}
