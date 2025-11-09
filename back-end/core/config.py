import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    SPOTIFY_CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
    SPOTIFY_CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
    SPOTIFY_REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")
    DEBUG = os.getenv("DEBUG", "false").lower() == "true"

settings = Settings()