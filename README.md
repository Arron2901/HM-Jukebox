# HM Jukebox

Jukebox touchscreen that streams music via the Spotify Web Playback SDK. The kiosk view runs on a desktop browser and controls playback, while a lightweight `/remote` page lets guests on the same Wi‑Fi add songs from their phones.

## 1. Prerequisites

- Spotify Premium account and an app registered at <https://developer.spotify.com/dashboard>
- Node.js 18+ and npm
- Python 3.10+ (with `pip`)

## 2. Backend setup

1. Create `back-end/.env` with your Spotify app credentials:

   ```bash
   cd back-end
   touch .env
   ```

   ```env
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/spotify/callback
   DEBUG=true
   ```

   > Ensure `SPOTIFY_REDIRECT_URI` exactly matches the redirect URI configured for your Spotify app.

2. Install dependencies and start the FastAPI server:

   ```bash
   pip install -r requirements.txt
   uvicorn back-end.main:app --host 0.0.0.0 --port 8000
   ```

   > Use `--host 0.0.0.0` so phones/tablets on the LAN can reach the API.

## 3. Frontend setup

1. Install packages and run Vite on all interfaces:

   ```bash
   cd front-end
   npm install
   npm run dev -- --host 0.0.0.0 --port 5173
   ```

2. On the kiosk machine, open the main UI (with Spotify auth) at `http://localhost:5173`.

3. Guests can open the remote queue page by visiting `http://<your-host-ip>:5173/remote`. (This route is enabled automatically when the kiosk script discovers a LAN IP and writes it to `front-end/.env`.)

## 4. Spotify auth

The kiosk view (`/`) requires Spotify login and keeps the token fresh automatically. Remote guests hitting `/remote` never touch Spotify—they search through the backend and their choices are picked up by the kiosk queue.

## 5. Chrome helper extension (optional)

`chrome-extension/` holds a Manifest v3 helper that lets the Admin overlay jump between the kiosk tab and `play.autodarts.io`. Load it via `chrome://extensions → Load unpacked`.

## 6. Launch everything with the kiosk script

From the repo root:

```bash
chmod +x run_kiosk.sh   # already marked executable; run once if needed
./run_kiosk.sh
```

The script:

- Detects the machine’s LAN IP and writes `VITE_REMOTE_HOST=http://<ip>:5173` to `front-end/.env` (enabling `/remote` + QR code).
- Starts the FastAPI backend (`uvicorn … --host 0.0.0.0 --port 8000`).
- Starts the Vite frontend (`npm run dev -- --host 0.0.0.0 --port 5173`).
- Launches Chromium in kiosk mode pointing at `http://localhost:5173`.

If it can’t detect a LAN IP, the `/remote` route is disabled and no QR code is shown.

## To‑Do
- [ ] Expose the current playback queue via the backend so remote clients can see “Up Next”.
