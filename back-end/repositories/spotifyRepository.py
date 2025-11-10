from models.track import Track
from spotipy import Spotify
from spotipy.oauth2 import SpotifyOAuth
import spotipy

scope = (
    "user-read-playback-state "
    "user-modify-playback-state "
    "user-read-currently-playing "
    "playlist-read-private "
    "streaming "
    "app-remote-control "
    "user-read-email "
    "user-read-private"
)


class SpotifyRepository:
    """
    Class that handles all communication with the Spotify SDK
    """

    def __init__(self, client_id, client_secret, redirect_uri):
        scope = (
            "user-read-playback-state "
            "user-modify-playback-state "
            "user-read-currently-playing "
            "playlist-read-private "
            "streaming "
            "app-remote-control "
            "user-read-email "
            "user-read-private"
        )

        self.sp_oauth = SpotifyOAuth(
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=redirect_uri,
            scope=scope,
            cache_path=".cache"
        )

        self.sp = spotipy.Spotify(auth_manager=self.sp_oauth)

    def get_track_by_uri(self, uri: str) -> Track:
        result = self.sp.track(uri)
        return Track(
            name= result['name'],
            artist=", ".join(artist['name'] for artist in result['artists']),
            uri=result['uri'],
            album=result['album']['name'],
            album_art_url=result['album']['images'][0]['url'] if result['album']['images'] else None,
            duration_ms=result['duration_ms']
        )

    def search_tracks(self, query: str, limit: int=10) -> list[Track]:
        """
        Function that searches for a track by name or artist
        Returns an array of Track objects
        """
        tracks = []
        results = self.sp.search(q=query, type="track", limit=limit)

        for item in results['tracks']['items']:
            print(item['album']['images'][0]['url'])
            track = Track(
                name= item['name'],
                artist=", ".join(artist['name'] for artist in item['artists']),
                uri=item['uri'],
                album=item['album']['name'],
                album_art_url=item['album']['images'][0]['url'],
                duration_ms=item['duration_ms']
            )

            tracks.append(track)
        
        return tracks