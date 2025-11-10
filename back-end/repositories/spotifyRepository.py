from models.track import Track
from spotipy import Spotify
from spotipy.oauth2 import SpotifyOAuth
import spotipy

# Unified scope declaration so both auth bootstrap + refresh share the same permissions.
SCOPE = (
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
    Thin repository that hides the spotipy plumbing and returns strongly typed Track models.
    """

    def __init__(self, client_id, client_secret, redirect_uri):
        self.sp_oauth = SpotifyOAuth(
            client_id=client_id,
            client_secret=client_secret,
            redirect_uri=redirect_uri,
            scope=SCOPE,
            cache_path=".cache"
        )

        self.sp = spotipy.Spotify(auth_manager=self.sp_oauth)

    def refresh_access_token(self):
        """
        Refresh the cached access token and rebuild the Spotipy client with the new bearer.
        """
        token_info = self.sp_oauth.get_cached_token()
        if not token_info:
            return None
        refreshed = self.sp_oauth.refresh_access_token(token_info["refresh_token"])
        self.sp = spotipy.Spotify(auth=refreshed["access_token"])
        return refreshed

    def get_track_by_uri(self, uri: str) -> Track:
        """
        Fetch a single track via its URI, mapping Spotify fields into our dataclass.
        """
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
        Proxy the Spotify search endpoint and wrap the response in Track models.
        """
        tracks = []
        results = self.sp.search(q=query, type="track", limit=limit)

        for item in results['tracks']['items']:
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
