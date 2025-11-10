const resolveBackendUrl = () => {
    if (typeof window === "undefined") {
        return "http://127.0.0.1:8000";
    }
    const hostname = window.location.hostname || "127.0.0.1";
    return `http://${hostname}:8000`;
};

export const BACKEND_URL = resolveBackendUrl();

export async function searchTracks(query) {
    const res = await fetch(`${BACKEND_URL}/spotify/search?q=${encodeURIComponent(query)}`)
    return await res.json()
}

export async function fetchQueue() {
    const res = await fetch(`${BACKEND_URL}/spotify/queue`)
    return await res.json()
}

export async function deleteFromQueue(trackURI) {
    const res = await fetch(`${BACKEND_URL}/spotify/queue/${encodeURIComponent(trackURI)}`, {
        method: "DELETE",
    })

    if (!res.ok) {
        throw new Error("Failed to delete track from queue")
    }

    return await res.json()
}

export async function submitRemoteTrack(track) {
    const res = await fetch(`${BACKEND_URL}/spotify/remote-queue`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(track),
    })
    if (!res.ok) {
        throw new Error("Failed to submit remote track")
    }
    return res.json()
}

export async function fetchRemoteQueue() {
    const res = await fetch(`${BACKEND_URL}/spotify/remote-queue`)
    if (!res.ok) {
        throw new Error("Failed to fetch remote queue")
    }
    return res.json()
}

export async function deleteRemoteQueueItem(itemId) {
    const res = await fetch(`${BACKEND_URL}/spotify/remote-queue/${encodeURIComponent(itemId)}`, {
        method: "DELETE",
    })
    if (!res.ok) {
        throw new Error("Failed to delete remote queue item")
    }
    return res.json()
}

export async function git_pull() {
    const res = await fetch(`${BACKEND_URL}/spotify/api/pull`)
    return await res.json()
}
