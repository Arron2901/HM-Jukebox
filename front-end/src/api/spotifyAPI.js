export const BACKEND_URL = "http://127.0.0.1:8000"

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