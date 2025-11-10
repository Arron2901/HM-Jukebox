"""Domain model for music tracks used across both backend + frontend."""

from dataclasses import dataclass
from typing import Optional

@dataclass
class Track:
    """Class to represent a music track"""
    name: str
    artist: str
    uri: str
    album: str
    album_art_url: Optional[str] = None
    duration_ms: Optional[int] = None


    def formatted_duration(self) -> str:
        """Function that returns the duration of the song in mm:ss format"""
        if self.duration_ms is None:
            return "--:--"
        
        minutes = self.duration_ms // 60000
        seconds = (self.duration_ms % 60000) // 1000

        return f"{minutes}:{seconds:02d}"
    

    def full_title(self) -> str:
        """Function that returns a formatted readable track title"""
        return f"{self.name} - {self.artist}"
