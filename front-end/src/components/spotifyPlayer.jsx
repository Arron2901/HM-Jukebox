import { useEffect, useRef } from "react";

/**
 * Thin wrapper around the Spotify Web Playback SDK.
 * Creates the player once, wires up logging for every lifecycle event,
 * and surfaces key callbacks so the Home screen can react to state changes.
 */
export default function SpotifyPlayer({
  token,
  onReady,
  onPlayerStateChange,
  onActivateRequest,
}) {
  const playerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  // Track mount/unmount so we can see if the player ever gets torn down unexpectedly.
  useEffect(() => {
    console.log("SpotifyPlayer component mounted");
    return () => {
      console.log("SpotifyPlayer component unmounted");
      if (playerRef.current) {
        console.log("Disconnecting Spotify player instance");
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!token) return;

    const initializePlayer = () => {
      if (playerRef.current) {
        console.log("Spotify player already initialized, skipping re-init");
        return;
      }
      if (typeof window.Spotify === "undefined") {
        console.warn("Spotify SDK not ready yet; deferring initialization");
        return;
      }

      console.log("Initializing Spotify Web Playback SDK");
      const playerInstance = new Spotify.Player({
        name: "HM Jukebox",
        getOAuthToken: (cb) => cb(token),
        volume: 0.8,
      });
      playerRef.current = playerInstance;

      // Mirror every SDK error to the console for faster debugging in the kiosk.
      ["initialization_error", "authentication_error", "account_error", "playback_error"].forEach(
        (event) => {
          playerInstance.addListener(event, ({ message }) => {
            console.error(`[Spotify SDK] ${event}:`, message);
          });
        }
      );

      playerInstance.addListener("ready", async ({ device_id }) => {
        console.log("Spotify SDK ready with device ID", device_id);
        if (onActivateRequest) {
          await onActivateRequest(playerInstance);
        }
        onReady?.({ deviceId: device_id, player: playerInstance });
      });

      playerInstance.addListener("not_ready", ({ device_id }) => {
        console.warn("Spotify SDK device went offline", device_id);
      });

      playerInstance.addListener("player_state_changed", (state) => {
        onPlayerStateChange?.(state);
      });

      playerInstance.connect().then((success) => {
        if (success) {
          console.log("Spotify Web Playback SDK connected");
        } else {
          console.error("Spotify Web Playback SDK failed to connect");
        }
      });
    };

    // Load the SDK script once and reuse it across subsequent mounts.
    if (!scriptLoadedRef.current) {
      const existingScript = document.querySelector(
        "script[src='https://sdk.scdn.co/spotify-player.js']"
      );
      if (existingScript) {
        scriptLoadedRef.current = true;
      } else {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        script.onload = () => {
          scriptLoadedRef.current = true;
          if (window.onSpotifyWebPlaybackSDKReady) {
            window.onSpotifyWebPlaybackSDKReady();
          }
        };
        document.body.appendChild(script);
      }
    }

    if (scriptLoadedRef.current && window.Spotify) {
      initializePlayer();
    } else {
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
    }
  }, [token, onReady, onPlayerStateChange, onActivateRequest]);

  return null;
}
