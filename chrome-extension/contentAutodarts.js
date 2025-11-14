/**
 * Injects floating buttons on pages whose URL contains "autodarts".
 * - "Back to Jukebox": Asks the background worker to focus the kiosk tab.
 * - "Go to Autodarts Home": Navigates to the main autodarts URL.
 */

// This URL is defined in background.js, we add it here for the content script
const AUTODARTS_URL = "https://play.autodarts.io/";
const shouldRenderButtons = () => typeof window !== "undefined" && window.location.href.toLowerCase().includes("autodarts");

const BTN_JUKEBOX_ID = "hmj-autodarts-return";
const BTN_HOME_ID = "hmj-autodarts-home";

const renderButtons = () => {
  if (!shouldRenderButtons()) return;

  // --- 1. Render "Back to Jukebox" Button ---
  if (!document.getElementById(BTN_JUKEBOX_ID)) {
    const jukeboxButton = document.createElement("button");
    jukeboxButton.id = BTN_JUKEBOX_ID;
    jukeboxButton.textContent = "Back to HM Jukebox";
    Object.assign(jukeboxButton.style, {
      position: "fixed",
      top: "20px",
      right: "20px",
      zIndex: 9999,
      padding: "12px 18px",
      borderRadius: "6px",
      border: "none",
      background: "#111",
      color: "#fff",
      fontSize: "14px",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
    });

    jukeboxButton.addEventListener("click", () => {
      chrome.runtime.sendMessage({ type: "HMJ_FOCUS_JUKEBOX" }, (response) => {
        if (chrome.runtime.lastError) {
          console.warn("HM Jukebox helper extension error:", chrome.runtime.lastError.message);
          return;
        }
        if (!response?.success) {
          console.warn("HM Jukebox helper extension failed:", response?.reason);
        }
      });
    });

    document.body.appendChild(jukeboxButton);
  }

  // --- 2. Render "Go to Autodarts Home" Button (NEW) ---
  if (!document.getElementById(BTN_HOME_ID)) {
    const homeButton = document.createElement("button");
    homeButton.id = BTN_HOME_ID;
    homeButton.textContent = "Go to Autodarts Home";
    Object.assign(homeButton.style, {
      position: "fixed",
      top: "80px", // Positioned below the first button
      right: "20px",
      zIndex: 9999,
      padding: "12px 18px",
      borderRadius: "6px",
      border: "none",
      background: "#111", // A different color
      color: "#fff",
      fontSize: "14px",
      cursor: "pointer",
      boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
    });

    // Add click event to navigate to the Autodarts home page
    homeButton.addEventListener("click", () => {
      window.location.href = AUTODARTS_URL;
    });

    document.body.appendChild(homeButton);
  }
};

// --- Update the logic to call the new function name ---
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", renderButtons, { once: true });
} else {
  renderButtons();
}