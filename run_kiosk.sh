#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT=8000
FRONTEND_PORT=5173
CHROME_BIN=${CHROME_BIN:-"chromium-browser"}
KIOSK_URL=${KIOSK_URL:-"http://localhost:${FRONTEND_PORT}"}
FRONT_ENV_FILE="${ROOT_DIR}/front-end/.env"

cleanup() {
  echo "Shutting down kiosk processes..."
  [[ -n "${BACKEND_PID:-}" ]] && kill "${BACKEND_PID}" >/dev/null 2>&1 || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill "${FRONTEND_PID}" >/dev/null 2>&1 || true
}

trap cleanup EXIT

LAN_IP=$(python3 - <<'PY'
import socket
try:
    sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    sock.connect(("8.8.8.8", 80))
    print(sock.getsockname()[0])
finally:
    sock.close()
PY
)

if [[ -n "${LAN_IP}" ]]; then
  echo "Detected LAN IP: ${LAN_IP}"
  mkdir -p "$(dirname "${FRONT_ENV_FILE}")"
  touch "${FRONT_ENV_FILE}"
  TMP_FILE="${FRONT_ENV_FILE}.tmp"
  grep -v '^VITE_REMOTE_HOST=' "${FRONT_ENV_FILE}" > "${TMP_FILE}" || true
  printf "VITE_REMOTE_HOST=http://%s:%s\n" "${LAN_IP}" "${FRONTEND_PORT}" >> "${TMP_FILE}"
  mv "${TMP_FILE}" "${FRONT_ENV_FILE}"
  echo "Remote access enabled (QR/remote page will point to http://${LAN_IP}:${FRONTEND_PORT}/remote)"
else
  echo "Warning: unable to determine LAN IP. Remote access will be disabled."
  if [[ -f "${FRONT_ENV_FILE}" ]]; then
    TMP_FILE="${FRONT_ENV_FILE}.tmp"
    grep -v '^VITE_REMOTE_HOST=' "${FRONT_ENV_FILE}" > "${TMP_FILE}" || true
    mv "${TMP_FILE}" "${FRONT_ENV_FILE}"
  fi
fi

echo "Starting backend..."
(
  cd "${ROOT_DIR}/back-end"
  python3 -m uvicorn main:app --host 0.0.0.0 --port "${BACKEND_PORT}"
) &
BACKEND_PID=$!

echo "Starting frontend..."
(
  cd "${ROOT_DIR}/front-end"
  npm run dev -- --host 0.0.0.0 --port "${FRONTEND_PORT}"
) &
FRONTEND_PID=$!

echo "Waiting for services to boot..."
sleep 5

echo "Launching Chromium in kiosk mode at ${KIOSK_URL}"
"${CHROME_BIN}" --kiosk --app="${KIOSK_URL}" >/dev/null 2>&1 &
CHROME_PID=$!

wait "${BACKEND_PID}" "${FRONTEND_PID}" "${CHROME_PID}"
