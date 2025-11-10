from pydantic import BaseModel

class TrackSchema(BaseModel):
    """API contract for tracks returned to the frontend."""

    name: str
    artist: str
    uri: str
    album: str
    album_art_url: str | None = None
    duration_ms: int

    class Config:
        orm_mode = True
