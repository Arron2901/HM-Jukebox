import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SpotifyPlayer from "../components/spotifyPlayer";
import Search from "../components/Search"; 
import AnimatedBackground from "../components/AnimatedBackground";
import Playback from "../components/Playback";
import Navbar from "../components/Navbar";
import AdminOverlay from "../components/AdminOverlay";
import "../App.css";
import { fetchRemoteQueue as fetchRemoteQueueAPI, deleteRemoteQueueItem } from "../api/spotifyAPI";

import "@fontsource/roboto-mono";
import "@fontsource/roboto-mono/400.css";
import "@fontsource/roboto-mono/700.css";
import "@fontsource/roboto-mono/400-italic.css";

// Hard-coded safety net playlist to keep music running when the queue is empty.
const FALLBACK_PLAYLIST_ID = "6koaBLo3EPH96TlQkpWUxa";

// Playlist metadata used for curated cards.
const basePlaylistConfig = () => {
  const now = new Date();
  const holiday = (now.getMonth() === 10 && now.getDate() >= 1) || (now.getMonth() === 11 && now.getDate() <= 28);

  return [
    {
      id: "eras",
      heading: "Playlists from the Eras",
      playlists: [
        {
          id: "80s",
          title: "80s Hits",
          playlistId: "3MirNEFoRiSgd6atQrQ4eW",
          fallbackCover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da847bb2e74941cc0a2532798f6d",
        },
        {
          id: "all-out-90s",
          title: "All Out 90s",
          playlistId: "4Yq0M74gg8oYQh16o8ve8Y",
          fallbackCover: "https://image-cdn-fa.spotifycdn.com/image/ab67706c0000da84dd8afedcc17fc2fbc9b50032",
        },
        {
          id: "all-out-00s",
          title: "All Out 00s",
          playlistId: "5nkn4PuVCtfMztJADQ0uR9",
          fallbackCover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da8467629902bf10d09d5ee1098f",
        },
      ],
    },
    {
      id: "genres",
      heading: "Playlists from the Genres",
      playlists: [
        {
          id: "pop-mix",
          title: "Pop Mix",
          playlistId: "0iGaX1GZgca1EO7Tsjicln",
          fallbackCover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da849b4db9b8b7a5211d4fee342d",
        },
        holiday
          ? {
              id: "christmas-mix",
              title: "Christmas Mix",
              playlistId: "2uSlS3yN0r3MRK2vUS3rEu",
              fallbackCover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84d49a1fe9c349be1dda04dcc7",
            }
          : {
              id: "rock-mix",
              title: "Rock Mix",
              playlistId: "3tx8h1aph7mrx0HzDbC9b2",
              fallbackCover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84c37f54cb119274d11490b021",
            },
        {
          id: "musical-mix",
          title: "Musical Mix",
          playlistId: "6KfbVFomPKKQWfGpc1O1mA",
          fallbackCover: "https://image-cdn-ak.spotifycdn.com/image/ab67706c0000da84f9b1517d2cfaa53c8bf7a371",
        },
      ],
    },
  ];
};

// Normalizes Spotify’s playlist-track payload into the shape our UI expects.
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

// Search results from the backend already contain simplified metadata; rename fields for consistency.
const mapSearchTrack = (track) => ({
  id: track.uri,
  uri: track.uri,
  name: track.name,
  artists: track.artist,
  albumArt: track.album_art_url,
  duration_ms: track.duration_ms,
});

const mapRemoteQueuedTrack = (track) => ({
  id: track.uri,
  uri: track.uri,
  name: track.name,
  artists: track.artist,
  albumArt: track.album_art_url,
  duration_ms: track.duration_ms,
});

// Custom hook that keeps a mutable ref in sync with state so async callbacks can read the latest value.
const useSyncedRef = (value) => {
  const ref = useRef(value);
  // Once the player is ready and we have fallback data, kick off the first track.
  // Adaptive polling loop: check often near the end of a track, otherwise every second.
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
};

// Convenience delay helper used to buffer Spotify API calls.
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Home orchestrates the entire kiosk experience: Spotify SDK setup, queue juggling,
 * playback polling, admin controls, and the main search/playback layout.
 */
export default function Home({ token, onManualRefreshToken }) {
  // Core playback/session state
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
  const [playlistCovers, setPlaylistCovers] = useState({});

  const curatedSections = useMemo(() => basePlaylistConfig(), []);

  // Mirror select state in refs so long-running callbacks can read latest values without stale closures.
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
  const remoteQueueProcessingRef = useRef(false);

  // When the current track changes we allow auto-advance to trigger again.
  useEffect(() => {
    endTriggeredRef.current = false;
  }, [currentTrack?.uri]);

  // Pulls ~1000 tracks from the fallback playlist and shuffles them for variety.
  const fetchFallbackPlaylist = useCallback(async () => {
    if (!token) return;

    const tracks = [];
    let offset = 0;
    const limit = 100;

    try {
      while (tracks.length < 2000) {
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
      const shuffled = tracks.slice(0, 2000).sort(() => Math.random() - 0.5);
      setFallbackQueue(shuffled);
      setFallbackIndex(0);
    } catch (error) {
      console.error("Failed to load fallback playlist", error);
    }
  }, [token]);

  useEffect(() => {
    fetchFallbackPlaylist();
  }, [fetchFallbackPlaylist]);

  useEffect(() => {
    if (!token) return;
    const abortController = new AbortController();
    const loadCovers = async () => {
      const ids = Array.from(
        new Set(
          curatedSections.flatMap((section) => section.playlists.map((playlist) => playlist.playlistId))
        )
      );
      try {
        const results = await Promise.all(
          ids.map(async (playlistId) => {
            try {
              const res = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}`, {
                headers: { Authorization: `Bearer ${token}` },
                signal: abortController.signal,
              });
              if (!res.ok) throw new Error(`Failed to fetch playlist ${playlistId}`);
              const data = await res.json();
              return { playlistId, cover: data.images?.[0]?.url || null };
            } catch (error) {
              console.error("Playlist cover fetch failed", playlistId, error);
              return { playlistId, cover: null };
            }
          })
        );
        setPlaylistCovers((prev) => {
          const next = { ...prev };
          results.forEach(({ playlistId, cover }) => {
            if (cover) next[playlistId] = cover;
          });
          return next;
        });
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Failed to load playlist covers", error);
        }
      }
    };
    loadCovers();
    return () => abortController.abort();
  }, [token, curatedSections]);

  // Ensures the Web Playback SDK device becomes the active Spotify target.
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

  // Helpful debug hook to see when the SDK device vanishes or reappears.
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

  // Single entry point to begin playback and reset all timing refs.
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

  // Pops the next track (prefer user queue, then fallback list).
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

  // Watches progress for “nearly done” tracks and schedules the next one.
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

  // When the SDK reports ready, transfer playback and mark the device as ready.
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

  // Shared Spotify Web API helper that injects auth + device headers.
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

  // Admin controls
  const handleAdminPlayPause = useCallback(() => {
    if (isPlaying) {
      pauseRequestedRef.current = true;
      sendPlaybackRequest(`https://api.spotify.com/v1/me/player/pause?device_id=${deviceId}`, {
        method: "PUT",
        body: JSON.stringify({}),
      });
    } else {
      pauseRequestedRef.current = false;
      pollSuppressUntilRef.current = Date.now() + 1000;
      sendPlaybackRequest(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: "PUT",
        body: JSON.stringify({}),
      });
    }
  }, [deviceId, isPlaying, sendPlaybackRequest]);

  const handleAdminNext = useCallback(() => {
    pollSuppressUntilRef.current = Date.now() + 1000;
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
      pollSuppressUntilRef.current = Date.now() + 500;
      sendPlaybackRequest(
        `https://api.spotify.com/v1/me/player/volume?volume_percent=${value}&device_id=${deviceId}`,
        { method: "PUT" }
      );
    },
    [deviceId, sendPlaybackRequest]
  );

  // SDK push events keep us in sync between polls and catch manual actions.
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

  // Polling fallback so we don't rely solely on player_state_changed events.
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

        const duration = trackProgressRef.current.duration || 0;
        const position = trackProgressRef.current.position || 0;
        const remaining = Math.max(0, duration - position);

        let nextDelay = 1000;
        if (duration > 0) {
          const progressRatio = position / duration;
          if (progressRatio < 0.5) {
            nextDelay = 2000; // Slow polling for the first half of the track.
          } else if (remaining <= 1000) {
            nextDelay = 200; // Final sprint: extra tight polling in the last second.
          } else {
            nextDelay = 1000; // Standard 1s cadence for the back half.
          }
        }

        schedulePoll(nextDelay);
      }, delay);
    };

    schedulePoll(0);

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [token, playerReady, syncPlaybackState, trackProgressRef]);

  // Ensure delayed auto-advance timers never fire after unmount.
  useEffect(() => () => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  // Adds user picks to the queue and removes duplicates from fallback order.
  const enqueueUserTrack = useCallback(
    (normalized) => {
      if (!normalized?.uri) return;
      const alreadyQueued = userQueueRef.current.some((item) => item.uri === normalized.uri);
      if (alreadyQueued) return;
      userQueueRef.current = [...userQueueRef.current, normalized];
      setUserQueue((prev) => [...prev, normalized]);
      setFallbackQueue((prev) => prev.filter((item) => item.uri !== normalized.uri));
    },
    [userQueueRef]
  );

  const handleAddTrack = useCallback(
    (track) => {
      if (!track?.uri) return;
      const normalized = mapSearchTrack(track);
      enqueueUserTrack(normalized);
    },
    [enqueueUserTrack]
  );

  // Clicking a curated playlist fetches a sample and injects it into the search results pane.
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

  // Compose the “Up Next” list by prioritizing user tracks and filling the rest with fallback picks.
  const resolvedPlaylistSections = useMemo(() => {
    return curatedSections.map((section) => ({
      ...section,
      playlists: section.playlists.map((playlist) => ({
        ...playlist,
        cover: playlistCovers[playlist.playlistId] || playlist.fallbackCover || "",
      })),
    }));
  }, [curatedSections, playlistCovers]);

  const upcomingQueue = useMemo(() => {
    const userUris = new Set(userQueue.map((track) => track.uri));
    const fallbackStart = fallbackQueue
      .slice(Math.min(fallbackIndex, fallbackQueue.length))
      .filter((track) => !userUris.has(track.uri));
    return [...userQueue, ...fallbackStart];
  }, [userQueue, fallbackQueue, fallbackIndex]);

  // Safari/iOS require a user gesture; this helper keeps the SDK happy when requested.
  const activatePlayerElement = useCallback(async (player) => {
    try {
      await player.activateElement();
      console.log("Spotify player element activated");
    } catch (error) {
      console.error("Failed to activate player element", error);
    }
  }, []);

  const processRemoteQueue = useCallback(async () => {
    if (remoteQueueProcessingRef.current) return;
    remoteQueueProcessingRef.current = true;
    try {
      const items = await fetchRemoteQueueAPI();
      if (!Array.isArray(items) || !items.length) return;
      for (const item of items) {
        enqueueUserTrack(mapRemoteQueuedTrack(item));
        await deleteRemoteQueueItem(item.id);
      }
    } catch (error) {
      console.error("Failed to process remote queue", error);
    } finally {
      remoteQueueProcessingRef.current = false;
    }
  }, [enqueueUserTrack]);

  useEffect(() => {
    const interval = setInterval(processRemoteQueue, 3000);
    return () => clearInterval(interval);
  }, [processRemoteQueue]);

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
              playlistSections={resolvedPlaylistSections}
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
              onRefreshToken={onManualRefreshToken}
            />
          )}
        </div>
      </main>
      {/* Keep the Spotify Web Playback SDK mounted at all times so the device stays active. */}
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
