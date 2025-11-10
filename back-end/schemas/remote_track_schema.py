from pydantic import BaseModel
from typing import Optional


class RemoteTrackPayload(BaseModel):
    """Incoming payload when a remote client requests a song."""

    name: str
    artist: str
    uri: str
    album: Optional[str] = None
    album_art_url: Optional[str] = None
    duration_ms: Optional[int] = None


class RemoteQueuedTrack(RemoteTrackPayload):
    """Remote track plus a server-generated identifier."""

    id: str
