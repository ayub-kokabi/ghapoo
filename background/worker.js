import { searchNitter } from "./service.js";

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request?.action !== "searchNitter") return;

  const text = request.text;
  if (typeof text !== "string" || !text.trim()) {
    sendResponse({ success: false, error: "Invalid text" });
    return;
  }

  const query = `"${text.trim()}"`;

  (async () => {
    try {
      const result = await searchNitter(query);

      if (!result || typeof result !== "object") {
        sendResponse({ success: false, error: "Unexpected response format" });
        return;
      }

      sendResponse(result);
    } catch (err) {
      console.error("[searchNitter] failed:", err);
      sendResponse({
        success: false,
        error: err?.message || "All sources failed.",
      });
    }
  })();

  return true;
});
