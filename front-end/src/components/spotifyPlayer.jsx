import { useEffect, useRef } from "react";
import { BACKEND_URL } from "../api/spotifyAPI";

/**
 * This function should live outside your component or in a separate utility file.
 * It's responsible for contacting your server to get a *fresh* access token.
 * Your server will use its stored refresh_token to make this request.
 */
async function getNewAccessToken() {
  try {
    // This is an API endpoint *you* must create on your own server.
    const response = await fetch(`${BACKEND_URL}/spotify/refresh-token`, { method: "POST" }); 
    
    if (!response.ok) {
      // If a refresh fails, you might need to force the user to log in again.
      console.error('Could not refresh token. User may need to re-authenticate.');
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    return data.access_token; // Assumes your server returns { access_token: "..." }

  } catch (error) {
    console.error('Error fetching new access token:', error);
  }
}

/**
 * Thin wrapper around the Spotify Web Playback SDK.
 */
export default function SpotifyPlayer({
  // Notice: 'token' prop is REMOVED.
  onReady,
  onPlayerStateChange,
  onActivateRequest,
}) {
  const playerRef = useRef(null);
  const scriptLoadedRef = useRef(false);

  // Your mount/unmount effect is fine as-is.
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

  // This effect now only runs once on mount (or if callbacks change).
  useEffect(() => {
    // We no longer check for a 'token' prop.
    
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
        
        // ===================================================================
        // THE FIX:
        // Provide a function that *fetches* a fresh token every time
        // the SDK asks for one.
        // ===================================================================
        getOAuthToken: async (cb) => {
          console.log("Spotify SDK needs a new token...");
          const token = await getNewAccessToken();
          if (token) {
            cb(token);
          } else {
            console.error("Failed to get new token for SDK");
          }
        },
        volume: 0.8,
      });
      // ===================================================================

      playerRef.current = playerInstance;

      // ... all your listeners are perfect, no changes needed ...
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

    // ... your script loading logic is fine, no changes needed ...
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

    // Dependency array no longer needs 'token'
  }, [onReady, onPlayerStateChange, onActivateRequest]);

  return null;
}