from models.track import Track
from repositories.spotifyRepository import SpotifyRepository
from typing import List, Optional
from unidecode import unidecode


class SpotifyService:
    """
    Service layer responsible for managing business logic such as
    searching, queueing, and playback control for the jukebox.
    """

    def __init__(self, spotify_repo: SpotifyRepository):
        self.spotify_repo = spotify_repo
        self.queue: List[Track] = []
        self.current_track: Optional[Track] = None
        self.mode = "custom"

    # Searching
    def search_tracks(self, query: str, limit: int = 10) -> List[Track]:
        """
        Use the repository to search Spotify for tracks by name or artist.
        """
        return self.spotify_repo.search_tracks(query, limit)

    # Queue Tracks
    def queue_track(self, track: Track):
        """
        Add a track to the playback queue.
        """
        if self.queue.count(track) <= 0:
            self.queue.append(track)
            print(f"Queued track: {track.name} by {track.artist}")

    # Gets the current queue
    def get_queue(self) -> List[Track]:
        """
        Return the current queue as a list of Track objects.
        """
        return self.queue

    # Clears the current queue
    def clear_queue(self):
        """
        Empty the playback queue.
        """
        self.queue.clear()
        print("Queue cleared.")

    # Get the currently playing track
    def get_current_track(self) -> Optional[Track]:
        """
        Return the currently playing track, if any.
        """
        return self.current_track
        
    
    # Removes Item from queue
    def remove_from_queue(self, uri: str):
        """
        Removes an item from the queue based on uri
        """
        for i, track in enumerate(self.queue):
            if track.uri == uri:
                return self.queue.pop(i)
            
        return None


    # Shuffles queue
    def shuffle_queue(self):
        """
        Shuffles item in the queue
        """
        import random

        random.shuffle(self.queue)
        print("Queue shuffled")