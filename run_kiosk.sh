#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_PORT=8000
FRONTEND_PORT=5173

find_chrome_bin() {
  local os_type="unknown"
  local candidates=()
  local chrome_path=""
  echo "--- Starting Chrome search ---" >&2

  case "$(uname -s)" in
    Linux*)
      if grep -qi "Microsoft" /proc/version &>/dev/null; then
        os_type="wsl"
      else
        os_type="linux"
      fi
      ;;
    Darwin*)
      os_type="macos"
      ;;
    CYGWIN*|MINGW*|MSYS*)
      os_type="windows_bash"
      ;;
  esac

  echo "Detected OS type: ${os_type}" >&2

  # 2. Set search paths based on OS
  case "$os_type" in
    "macos")
      candidates=(
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        "/Applications/Chromium.app/Contents/MacOS/Chromium"
      )
      ;;
    "linux")
      for cmd in "google-chrome-stable" "google-chrome" "chromium-browser" "chromium"; do
        if command -v "$cmd" &>/dev/null; then
          echo "$(command -v "$cmd")"
          return 0
        fi
      done
      ;;
    "windows_bash")
      echo "Checking Windows (Git Bash) paths..." >&2
      local pf_win pf_x86_win user_profile_win
      local pf pf_x86 user_profile
      local all_env

      all_env=$(env)
      echo "Grepping for env vars..." >&2

      pf_win=$(echo "$all_env" | grep -i '^ProgramFiles=' | cut -d '=' -f 2- | tr -d '\r')
      pf_x86_win=$(echo "$all_env" | grep -i '^ProgramFiles(x86)=' | cut -d '=' -f 2- | tr -d '\r')
      user_profile_win=$(echo "$all_env" | grep -i '^USERPROFILE=' | cut -d '=' -f 2- | tr -d '\r')

      echo "Found Windows ProgramFiles: [$pf_win]" >&2
      echo "Found Windows ProgramFiles(x86): [$pf_x86_win]" >&2
      echo "Found Windows USERPROFILE: [$user_profile_win]" >&2

      pf=$(echo "$pf_win" | sed -e 's/\\/\//g' -e 's/://')
      pf_x86=$(echo "$pf_x86_win" | sed -e 's/\\/\//g' -e 's/://')
      user_profile=$(echo "$user_profile_win" | sed -e 's/\\/\//g' -e 's/://')
      
      candidates=(
        "/$pf/Google/Chrome/Application/chrome.exe"
        "/$pf_x86/Google/Chrome/Application/chrome.exe"
        "/$user_profile/AppData/Local/Google/Chrome/Application/chrome.exe"
        "/$pf/Microsoft/Edge/Application/msedge.exe"
        "/$pf_x86/Microsoft/Edge/Application/msedge.exe"
      )
      ;;
    "wsl")
      echo "Checking Windows (WSL) paths..." >&2
      local pf pf_x86 user_profile
      local full_set_output

      full_set_output=$(cmd.exe /c "set" </dev/null 2>&1 || true)
      echo "RAW 'set' command output received (for WSL)." >&2

      pf=$(echo "$full_set_output" | grep -i '^ProgramFiles=' | cut -d '=' -f 2- | tr -d '\r')
      pf_x86=$(echo "$full_set_output" | grep -i '^ProgramFiles(x86)=' | cut -d '=' -f 2- | tr -d '\r')
      user_profile=$(echo "$full_set_output" | grep -i '^USERPROFILE=' | cut -d '=' -f 2- | tr -d '\r')

      echo "Parsed pf: [$pf]" >&2
      echo "Parsed pf_x86: [$pf_x86]" >&2
      echo "Parsed user_profile: [$user_profile]" >&2

      candidates=(
        "$(wslpath -u "$pf")/Google/Chrome/Application/chrome.exe"
        "$(wslpath -u "$pf_x86")/Google/Chrome/Application/chrome.exe"
        "$(wslpath -u "$user_profile")/AppData/Local/Google/Chrome/Application/chrome.exe"
        "$(wslpath -u "$pf")/Microsoft/Edge/Application/msedge.exe"
        "$(wslpath -u "$pf_x86")/Microsoft/Edge/Application/msedge.exe"
      )
      ;;
    *)
      echo "Unknown OS type. Search may fail." >&2
      ;;
  esac

  echo "Checking ${#candidates[@]} potential paths..." >&2
  for path in "${candidates[@]}"; do
    echo "  Checking: $path" >&2
    if [[ -f "$path" ]]; then
      echo "--- Found executable at: $path ---" >&2
      echo "$path"
      return 0
    fi
  done

  echo "--- Executable not found in any standard location. ---" >&2
  echo "Error: Could not automatically find Chrome executable." >&2
  return 1
}

if [[ -z "${CHROME_BIN:-}" ]]; then
  echo "CHROME_BIN not set, attempting to find automatically..."
  CHROME_BIN=$(find_chrome_bin || true)
  if [[ -z "${CHROME_BIN}" ]]; then
    echo "Failed to find Chrome. Exiting." >&2
    echo "You can set the path manually before running this script:" >&2
    echo "  export CHROME_BIN=\"/path/to/your/chrome\"" >&2
    exit 1
  fi
  echo "Found Chrome at: ${CHROME_BIN}"
else
  echo "Using user-provided CHROME_BIN: ${CHROME_BIN}"
fi

KIOSK_URL=${KIOSK_URL:-"http://localhost:${FRONTEND_PORT}"}
FRONT_ENV_FILE="${ROOT_DIR}/front-end/.env"

cleanup() {
  echo "Shutting down kiosk processes..."
  [[ -n "${BACKEND_PID:-}" ]] && kill 0 "${BACKEND_PID}" 2>/dev/null && kill "${BACKEND_PID}" >/dev/null 2>&1 || true
  [[ -n "${FRONTEND_PID:-}" ]] && kill 0 "${FRONTEND_PID}" 2>/dev/null && kill "${FRONTEND_PID}" >/dev/null 2>&1 || true
  [[ -n "${CHROME_PID:-}" ]] && kill 0 "${CHROME_PID}" 2>/dev/null && kill "${CHROME_PID}" >/dev/null 2>&1 || true
}

trap cleanup EXIT
trap cleanup INT

LAN_IP=$(python - <<'PY'
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
  python -m pip install -r requirements.txt
  python -m uvicorn main:app --host 0.0.0.0 --port "${BACKEND_PORT}"
) &
BACKEND_PID=$!

echo "Starting frontend..."
(
  cd "${ROOT_DIR}/front-end"
  npm install
  npm run dev -- --host 0.0.0.0 --port "${FRONTEND_PORT}"
) &
FRONTEND_PID=$!

echo "Waiting for services to boot..."
sleep 5

echo "Launching Chromium in kiosk mode at ${KIOSK_URL}"
"${CHROME_BIN}" --kiosk --disable-pinch --overscroll-history-navigation=0 "${KIOSK_URL}" >/dev/null 2>&1 &
CHROME_PID=$!

wait "${BACKEND_PID}" "${FRONTEND_PID}" "${CHROME_PID}"