from fastapi import APIRouter, Depends, Request
from fastapi.responses import RedirectResponse
from services.spotifyService import SpotifyService
from core.dependencies import get_spotify_service
from schemas.track_schema import TrackSchema
import spotipy

router = APIRouter(
    prefix="/spotify",
    tags=["Spotify"]
)


# Search Router
@router.get("/search", response_model=list[TrackSchema])
def search_tracks(q: str, service: SpotifyService = Depends(get_spotify_service)):
    return service.search_tracks(q)


# Get queue
@router.get("/queue", response_model=list[TrackSchema])
def get_queue(service: SpotifyService = Depends(get_spotify_service)):
    return [
        TrackSchema(
                name=t.name,
                artist=t.artist,
                uri=t.uri,
                album=t.album,
                album_art_url=t.album_art_url,
                duration_ms=t.duration_ms
            )
        for t in service.get_queue()
    ]


# Add to queue
@router.post("/queue")
def add_to_queue(track_uri: str, service: SpotifyService = Depends(get_spotify_service)):
    track = service.spotify_repo.get_track_by_uri(track_uri)
    if track:
        if service.get_queue().count(track) > 0:
            return {"message": "Track already Queued"}
        
        service.queue_track(track)
        return {"message": f"Queued {track.name}"}
    return {"error": "Track not found"}


# Remove from queue
@router.delete("/queue/{uri}")
def remove_from_queue(uri: str, service: SpotifyService = Depends(get_spotify_service)):
    removed = service.remove_from_queue(uri)
    if removed:
        return {"message" : f"Removed {removed.name}"}
    return {"error" : "Invalid index"}


# Shuffle queue
@router.post("/queue/shuffle")
def shuffle_queue(service: SpotifyService = Depends(get_spotify_service)):
    service.shuffle_queue()
    return {"message" : "Queue shuffled"}



@router.get("/callback")
def spotify_callback(request: Request, service: SpotifyService = Depends(get_spotify_service)):
    code = request.query_params.get("code")

    if not code:
        return {"error": "No code provided by Spotify"}

    # Exchange the code for an access token
    token_info = service.spotify_repo.sp_oauth.get_access_token(code)
    access_token = token_info["access_token"]

    # Create the Spotify client using the access token
    service.spotify_repo.sp = spotipy.Spotify(auth=token_info["access_token"])

    redirect_url = f"http://localhost:5173/?access_token={access_token}"
    return RedirectResponse(redirect_url)


@router.get("/login")
def spotify_login(service: SpotifyService = Depends(get_spotify_service)):
    # Generate Spotify authorization URL
    auth_url = service.spotify_repo.sp_oauth.get_authorize_url()
    return RedirectResponse(auth_url)

