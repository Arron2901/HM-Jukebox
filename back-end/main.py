from fastapi import FastAPI
from routers import spotify_router
from fastapi.middleware.cors import CORSMiddleware

# Primary FastAPI app that wires in the Spotify router and kiosk-specific CORS rules.
app = FastAPI(title="HM Jukebox")

origins = [
    "http://127.0.0.1:5173",
    "http://localhost:5173"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Route registrations live in routers.spotify_router to keep main clean.
app.include_router(spotify_router.router)
