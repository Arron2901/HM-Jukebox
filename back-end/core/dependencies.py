"""Shared FastAPI dependency providers so everything uses the same Spotify client."""

from repositories.spotifyRepository import SpotifyRepository
from services.spotifyService import SpotifyService
from core.config import settings

# Dependency singletons (you could use dependency_overrides in tests later)
spotify_repo = SpotifyRepository(
    client_id=settings.SPOTIFY_CLIENT_ID,
    client_secret=settings.SPOTIFY_CLIENT_SECRET,
    redirect_uri=settings.SPOTIFY_REDIRECT_URI
)
spotify_service = SpotifyService(spotify_repo)

def get_spotify_service() -> SpotifyService:
    """
    Dependency provider for SpotifyService.
    Can be used with FastAPI's Depends().
    """
    return spotify_service
