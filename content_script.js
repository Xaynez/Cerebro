cat > extension/content_script.js <<'EOF'
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.action === "captureImage" && msg.srcUrl) {
    try {
      const blob = await fetch(msg.srcUrl).then(r => r.blob());
      const reader = new FileReader();
      reader.onloadend = () => {
        chrome.runtime.sendMessage({ action: "imageCaptured", dataUrl: reader.result });
      };
      reader.readAsDataURL(blob);
    } catch (e) {
      console.error("Image capture failed", e);
      chrome.runtime.sendMessage({ action: "imageCaptured", dataUrl: null, error: String(e) });
    }
  } else if (msg.action === "createReport") {
    try {
      const tables = Array.from(document.querySelectorAll("table")).map(t => {
        const headers = Array.from(t.querySelectorAll("thead th")).map(h => h.innerText.trim());
        const rows = Array.from(t.querySelectorAll("tbody tr")).map(tr =>
          Array.from(tr.querySelectorAll("td")).map(td => td.innerText.trim())
        );
        return { headers, rows };
      });
      chrome.runtime.sendMessage({ action: "tablesExtracted", tables, selection: msg.selection });
    } catch (e) {
      console.error("Table extraction failed", e);
      chrome.runtime.sendMessage({ action: "tablesExtracted", tables: [], selection: msg.selection, error: String(e) });
    }
  }
});
EOF
