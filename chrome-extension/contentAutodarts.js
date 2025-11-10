/**
 * Injects a floating "Back to Jukebox" button on pages whose URL contains "autodarts".
 * When pressed, it asks the background worker to focus the kiosk tab.
 */
const shouldRenderButton = () => typeof window !== "undefined" && window.location.href.toLowerCase().includes("autodarts");

const BTN_ID = "hmj-autodarts-return";

const renderButton = () => {
  if (!shouldRenderButton()) return;
  if (document.getElementById(BTN_ID)) return;

  const button = document.createElement("button");
  button.id = BTN_ID;
  button.textContent = "Back to HM Jukebox";
  Object.assign(button.style, {
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

  button.addEventListener("click", () => {
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

  document.body.appendChild(button);
};

if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", renderButton, { once: true });
} else {
  renderButton();
}
