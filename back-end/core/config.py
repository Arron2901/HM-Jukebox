import os
from dotenv import load_dotenv

# Load environment variables once at import so downstream modules can read secrets.
load_dotenv()


class Settings:
    """Centralized configuration object for the backend."""

    SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
    SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
    SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"


settings = Settings()
