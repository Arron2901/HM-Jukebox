/**
 * Bridges window.postMessage events from the web app into the extension runtime.
 */
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  const payload = event.data;
  if (!payload || payload.source !== "HM_JUKEBOX_ADMIN") return;

  if (payload.type === "OPEN_AUTODARTS") {
    chrome.runtime.sendMessage({ type: "HMJ_OPEN_AUTODARTS" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("HM Jukebox helper extension error:", chrome.runtime.lastError.message);
        return;
      }
      if (!response?.success) {
        console.warn("HM Jukebox helper extension failed:", response?.reason);
      }
    });
  }

  if (payload.type === "FOCUS_JUKEBOX") {
    chrome.runtime.sendMessage({ type: "HMJ_FOCUS_JUKEBOX" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("HM Jukebox helper extension error:", chrome.runtime.lastError.message);
        return;
      }
      if (!response?.success) {
        console.warn("HM Jukebox helper extension failed:", response?.reason);
      }
    });
  }

  if (payload.type === "MINIMIZE_CHROME") {
    chrome.runtime.sendMessage({ type: "HMJ_MINIMIZE_CHROME" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("HM Jukebox helper extension error:", chrome.runtime.lastError.message);
        return;
      }
      if (!response?.success) {
        console.warn("HM Jukebox helper extension failed:", response?.reason);
      }
    });
  }
});
