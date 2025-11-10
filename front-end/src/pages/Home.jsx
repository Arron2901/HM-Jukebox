import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SpotifyPlayer from "../components/spotifyPlayer";
import Search from "../components/Search"; 
import AnimatedBackground from "../components/AnimatedBackground";
import Playback from "../components/Playback";
import Navbar from "../components/Navbar";
import AdminOverlay from "../components/AdminOverlay";
import "../App.css";

import "@fontsource/roboto-mono";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/700.css";
import "@fontsource/roboto-mono/400-italic.css";

const FALLBACK_PLAYLIST_ID = "6koaBLo3EPH96TlQkpWUxa";

const mapSpotifyItem = (item) => {
  const track = item?.track;
  if (!track) return null;
  return {
    id: track.id,
    uri: track.uri,
    name: track.name,
    artists: track.artists?.map((artist) => artist.name).join(", ") ?? "",
    albumArt: track.album?.images?.[0]?.url ?? "",
    duration_ms: track.duration_ms ?? 0,
  };
};

const mapSearchTrack = (track) => ({
  id: track.uri,
  uri: track.uri,
  name: track.name,
  artists: track.artist,
  albumArt: track.album_art_url,
  duration_ms: track.duration_ms,
});

const useSyncedRef = (value) => {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export default function Home({ token }) {
  const [deviceId, setDeviceId] = useState(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [fallbackQueue, setFallbackQueue] = useState([]);
  const [fallbackIndex, setFallbackIndex] = useState(0);
  const [userQueue, setUserQueue] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volumePercent, setVolumePercent] = useState(50);
  const [trackProgress, setTrackProgress] = useState({ position: 0, duration: 0 });
  const [externalSearch, setExternalSearch] = useState(null);
  const [playlistLoading, setPlaylistLoading] = useState(false);

  const fallbackQueueRef = useSyncedRef(fallbackQueue);
  const fallbackIndexRef = useSyncedRef(fallbackIndex);
  const userQueueRef = useSyncedRef(userQueue);
  const currentTrackRef = useSyncedRef(currentTrack);
  const trackProgressRef = useSyncedRef(trackProgress);
  const endTriggeredRef = useRef(false);
  const autoAdvanceCooldownRef = useRef(0);
  const advanceTimerRef = useRef(null);
  const pollSuppressUntilRef = useRef(0);
  const pauseRequestedRef = useRef(false);

  useEffect(() => {
    endTriggeredRef.current = false;
  }, [currentTrack?.uri]);

  const fetchFallbackPlaylist = useCallback(async () => {
    if (!token) return;

    const tracks = [];
    let offset = 0;
    const limit = 100;

    try {
      while (tracks.length < 1000) {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${FALLBACK_PLAYLIST_ID}/tracks?limit=${limit}&offset=${offset}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Unable to load fallback playlist");
        }

        const data = await response.json();
        const items = (data.items || []).map(mapSpotifyItem).filter(Boolean);
        tracks.push(...items);

        if (!data.next) break;
        offset += limit;
      }
      const shuffled = tracks.slice(0, 1000).sort(() => Math.random() - 0.5);
      setFallbackQueue(shuffled);
      setFallbackIndex(0);
    } catch (error) {
      console.error("Failed to load fallback playlist", error);
    }
  }, [token]);

  useEffect(() => {
    fetchFallbackPlaylist();
  }, [fetchFallbackPlaylist]);

  const transferPlayback = useCallback(
    async (targetDeviceId) => {
      if (!token || !targetDeviceId) return false;
      try {
        const response = await fetch("https://api.spotify.com/v1/me/player", {
          method: "PUT",
          body: JSON.stringify({ device_ids: [targetDeviceId], play: false }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const body = await response.text();
          console.error("transferPlayback failed", response.status, body);
          return false;
        }

        console.log("transferPlayback succeeded", targetDeviceId);
        return true;
      } catch (error) {
        console.error("Failed to transfer playback", error);
        return false;
      }
    },
    [token]
  );

  const logAvailableDevices = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch("https://api.spotify.com/v1/me/player/devices", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const devices = await response.json();
      console.log("Available devices", devices);
    } catch (error) {
      console.error("Failed to fetch devices", error);
    }
  }, [token]);

  const startTrack = useCallback(
    async (track) => {
      if (!track || !deviceId || !token) return;

      try {
        console.log("Attempting to start track", track.name, "on device", deviceId);
        const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: "PUT",
          body: JSON.stringify({ uris: [track.uri] }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const body = await response.text();
          console.error("Failed to start playback", response.status, body);
          return;
        }
        console.log("Playback started", track.name);
        setCurrentTrack(track);
        setTrackProgress({ position: 0, duration: track.duration_ms || 0 });
        endTriggeredRef.current = false;
        autoAdvanceCooldownRef.current = Date.now() + 5000;
        pollSuppressUntilRef.current = Date.now() + 5000;
        pauseRequestedRef.current = false;
      } catch (error) {
        console.error("Failed to start playback", error);
      }
    },
    [deviceId, token]
  );

  const getNextTrack = useCallback(() => {
    if (userQueueRef.current.length > 0) {
      const [next, ...rest] = userQueueRef.current;
      userQueueRef.current = rest;
      setUserQueue(rest);
      return next;
    }

    const fallbackList = fallbackQueueRef.current;
    if (!fallbackList.length) return null;

    let idx = fallbackIndexRef.current;
    if (idx >= fallbackList.length) {
      idx = 0;
    }
    const nextTrack = fallbackList[idx];
    fallbackIndexRef.current = idx + 1;
    setFallbackIndex(idx + 1);
    return nextTrack ?? null;
  }, [fallbackIndexRef, fallbackQueueRef, userQueueRef]);

  const playNext = useCallback(async () => {
    const nextTrack = getNextTrack();
    if (nextTrack) {
      await startTrack(nextTrack);
    }
  }, [getNextTrack, startTrack]);

  const maybeTriggerAdvance = useCallback(
    (isPlayingState, position, duration) => {
      if (!duration || duration <= 0) return;
      const remaining = duration - position;
      if (remaining > 2000) return;
      if (!isPlayingState && position <= 0 && !currentTrackRef.current) return;
      if (endTriggeredRef.current) return;
      const now = Date.now();
      if (now < autoAdvanceCooldownRef.current) return;
      endTriggeredRef.current = true;
      autoAdvanceCooldownRef.current = now + 3000;
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
      console.log("Auto advancing queue (remaining ms):", remaining);
      advanceTimerRef.current = setTimeout(() => {
        playNext();
        advanceTimerRef.current = null;
      }, 800);
    },
    [playNext, currentTrackRef]
  );

  useEffect(() => {
    if (deviceId && playerReady && fallbackQueue.length && !currentTrack) {
      playNext();
    }
  }, [deviceId, playerReady, fallbackQueue.length, currentTrack, playNext]);

  const handlePlayerReady = useCallback(
    async ({ deviceId }) => {
      console.log("handlePlayerReady", deviceId);
      await logAvailableDevices();
      const transferred = await transferPlayback(deviceId);
      if (!transferred) return;
      await wait(750);
      setDeviceId(deviceId);
      setPlayerReady(true);
    },
    [logAvailableDevices, transferPlayback]
  );

  const sendPlaybackRequest = useCallback(
    async (url, options = {}) => {
      if (!token || !deviceId) {
        console.warn("Playback command ignored; missing token or device");
        return;
      }
      const defaultHeaders = {
        Authorization: `Bearer ${token}`,
      };
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
          ...defaultHeaders,
        },
      });
      if (!response.ok) {
        const body = await response.text();
        console.error("Playback command failed", response.status, body);
      }
    },
    [token, deviceId]
  );

  const handleAdminPlayPause = useCallback(() => {
    if (isPlaying) {
      pauseRequestedRef.current = true;
      sendPlaybackRequest(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: "PUT",
        body: JSON.stringify({}),
      });
    } else {
      pauseRequestedRef.current = false;
      sendPlaybackRequest(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        body: JSON.stringify({}),
      });
    }
  }, [deviceId, isPlaying, sendPlaybackRequest]);

  const handleAdminNext = useCallback(() => {
    playNext();
  }, [playNext]);

  const handleAdminPrev = useCallback(() => {
    sendPlaybackRequest(`https://api.spotify.com/v1/me/player/previous?device_id=${deviceId}`, {
      method: "POST",
    });
  }, [deviceId, sendPlaybackRequest]);

  const handleAdminVolumeChange = useCallback(
    (value) => {
      setVolumePercent(value);
      sendPlaybackRequest(
        `https://api.spotify.com/v1/me/player/volume?volume_percent=${value}&device_id=${deviceId}`,
        { method: "PUT" }
      );
    },
    [deviceId, sendPlaybackRequest]
  );

  const handlePlayerStateChange = useCallback(
    (state) => {
      if (!state) return;
      setIsPlaying(!state.paused);
      if (typeof state.device?.volume_percent === "number") {
        setVolumePercent(state.device.volume_percent);
      }

      const duration =
        state.duration ||
        state.track_window?.current_track?.duration_ms ||
        currentTrackRef.current?.duration_ms ||
        0;
      setTrackProgress({ position: state.position, duration });

      if (!state.paused && state.position < 1000) {
        endTriggeredRef.current = false;
      }

      maybeTriggerAdvance(!state.paused, state.position, duration);

      if (state.paused && !pauseRequestedRef.current && !state.context?.metadata?.is_paused_by_user) {
        maybeTriggerAdvance(false, duration, duration);
      }
    },
    [currentTrackRef, maybeTriggerAdvance]
  );

  const syncPlaybackState = useCallback(async () => {
    if (!token) return;
    if (Date.now() < pollSuppressUntilRef.current) return;
    try {
      const response = await fetch("https://api.spotify.com/v1/me/player", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) return;
      const data = await response.json();
      if (!data) return;

      const duration = data.item?.duration_ms || currentTrackRef.current?.duration_ms || 0;
      const position = data.progress_ms ?? 0;
      setTrackProgress({ position, duration });
      setIsPlaying(Boolean(data.is_playing));
      if (typeof data.device?.volume_percent === "number") {
        setVolumePercent(data.device.volume_percent);
      }

      if (data.is_playing && position < 1000) {
        endTriggeredRef.current = false;
      }

      maybeTriggerAdvance(Boolean(data.is_playing), position, duration);
      if (!data.is_playing && !pauseRequestedRef.current) {
        maybeTriggerAdvance(false, duration, duration);
      }
      return { duration, position, isPlaying: Boolean(data.is_playing) };
    } catch (error) {
      console.error("Sync playback state failed", error);
    }
  }, [token, maybeTriggerAdvance, currentTrackRef]);

  useEffect(() => {
    if (!token || !playerReady) return;

    let timeoutId;
    let cancelled = false;

    const schedulePoll = (delay) => {
      timeoutId = setTimeout(async () => {
        if (Date.now() < pollSuppressUntilRef.current) {
          schedulePoll(500);
          return;
        }
        await syncPlaybackState();
        if (cancelled) return;
        const remaining = (trackProgressRef.current.duration || 0) - (trackProgressRef.current.position || 0);
        const nextDelay = remaining <= 3000 ? 300 : 1000;
        schedulePoll(nextDelay);
      }, delay);
    };

    schedulePoll(0);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [token, playerReady, syncPlaybackState, trackProgressRef]);

  useEffect(() => () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  const handleAddTrack = useCallback(
    (track) => {
      if (!track?.uri) return;
      const normalized = mapSearchTrack(track);

      userQueueRef.current = [...userQueueRef.current, normalized];
      setUserQueue((prev) => [...prev, normalized]);

      setFallbackQueue((prev) => prev.filter((item) => item.uri !== normalized.uri));
    },
    [userQueueRef]
  );

  const handlePlaylistSelect = useCallback(
    async (playlistId, title) => {
      if (!token || !playlistId) return;
      setPlaylistLoading(true);
      setExternalSearch(null);
      try {
        const response = await fetch(
          `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=100`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          const body = await response.text();
          console.error("Failed to load playlist", response.status, body);
          return;
        }
        const data = await response.json();
        const tracks = (data.items || []).map(mapSpotifyItem).filter(Boolean);
        if (!tracks.length) return;
        const sample = tracks.sort(() => Math.random() - 0.5).slice(0, 10);
        const normalized = sample.map((track) => ({
          uri: track.uri,
          name: track.name,
          artist: track.artists,
          album_art_url: track.albumArt,
          duration_ms: track.duration_ms,
        }));
        setExternalSearch({ query: `${title} Picks`, results: normalized });
      } catch (error) {
        console.error("Playlist fetch failed", error);
      } finally {
        setPlaylistLoading(false);
      }
    },
    [token]
  );

  const handleClearExternalSearch = useCallback(() => {
    setExternalSearch(null);
  }, []);

  const upcomingQueue = useMemo(() => {
    const userUris = new Set(userQueue.map((track) => track.uri));
    const fallbackStart = fallbackQueue
      .slice(Math.min(fallbackIndex, fallbackQueue.length))
      .filter((track) => !userUris.has(track.uri));
    return [...userQueue, ...fallbackStart];
  }, [userQueue, fallbackQueue, fallbackIndex]);

  const activatePlayerElement = useCallback(async (player) => {
    try {
      await player.activateElement();
      console.log("Spotify player element activated");
    } catch (error) {
      console.error("Failed to activate player element", error);
    }
  }, []);

  return (
    <div>
      <main className="main-content">
        <Navbar onAdminTrigger={() => setShowAdminPanel(true)} />
        <div className="content-body">
          <div className="container">
            <Playback currentTrack={currentTrack} queue={upcomingQueue} progress={trackProgress} />
            <Search
              onAddTrack={handleAddTrack}
              onPlaylistSelect={handlePlaylistSelect}
              externalQuery={externalSearch?.query}
              externalResults={externalSearch?.results}
              externalLoading={playlistLoading}
              onClearExternalResults={handleClearExternalSearch}
            />
          </div>
          {showAdminPanel && (
            <AdminOverlay
              onClose={() => setShowAdminPanel(false)}
              isPlaying={isPlaying}
              volume={volumePercent}
              onPlayPause={handleAdminPlayPause}
              onPrev={handleAdminPrev}
              onNext={handleAdminNext}
              onVolumeChange={handleAdminVolumeChange}
            />
          )}
        </div>
      </main>
      <SpotifyPlayer
        token={token}
        onReady={handlePlayerReady}
        onPlayerStateChange={handlePlayerStateChange}
        onActivateRequest={activatePlayerElement}
      />
      <AnimatedBackground/>
    </div>
  );
}
