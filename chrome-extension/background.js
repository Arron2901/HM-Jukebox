/**
 * Receives messages from the kiosk content script and advances to the next tab.
 */
const AUTODARTS_URL = "https://play.autodarts.io/";
const JUKEBOX_MATCHERS = ["localhost:5173", "127.0.0.1:5173"];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "HMJ_MINIMIZE_CHROME") {
    const windowId = sender?.tab?.windowId;

    if (typeof windowId !== "number") {
      sendResponse({ success: false, reason: "Missing window id for minimizing" });
      return true;
    }

    chrome.windows.update(windowId, { state: "minimized", focused: false }, () => {
      if (chrome.runtime.lastError) {
        sendResponse({ success: false, reason: chrome.runtime.lastError.message });
        return;
      }
      sendResponse({ success: true, windowId });
    });
    return true;
  }

  if (message?.type === "HMJ_OPEN_AUTODARTS") {
    chrome.tabs.query({}, (tabs) => {
      const existing = tabs.find((tab) => (tab.url || "").startsWith(AUTODARTS_URL));
      if (existing?.id) {
        chrome.windows.update(existing.windowId, { focused: true }, () => {
          chrome.tabs.update(existing.id, { active: true }, () => {
            sendResponse({ success: true, reused: true });
          });
        });
      } else {
        chrome.tabs.create({ url: AUTODARTS_URL }, (tab) => {
          if (!tab?.id) {
            sendResponse({ success: false, reason: "Unable to open autodarts tab" });
            return;
          }
          sendResponse({ success: true, created: true });
        });
      }
    });
    return true;
  }

  if (message?.type === "HMJ_FOCUS_JUKEBOX") {
    chrome.tabs.query({}, (tabs) => {
      if (!Array.isArray(tabs)) {
        sendResponse({ success: false, reason: "Unable to enumerate tabs" });
        return;
      }

      const targetTab = tabs.find((tab) => {
        const url = tab.url || "";
        return JUKEBOX_MATCHERS.some((matcher) => url.includes(matcher));
      });

      if (!targetTab?.id) {
        sendResponse({ success: false, reason: "Jukebox tab not found" });
        return;
      }

      chrome.windows.update(targetTab.windowId, { focused: true }, () => {
        chrome.tabs.update(targetTab.id, { active: true }, () => {
          sendResponse({ success: true });
        });
      });
    });
    return true;
  }
});
