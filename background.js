cat > extension/background.js <<'EOF'
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "cerebro-explain-image",
    title: "Cerebro: Explain image",
    contexts: ["image"]
  });
  chrome.contextMenus.create({
    id: "cerebro-create-report",
    title: "Cerebro: Create Data Report",
    contexts: ["selection", "page"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "cerebro-explain-image") {
    chrome.tabs.sendMessage(tab.id, { action: "captureImage", srcUrl: info.srcUrl });
  } else if (info.menuItemId === "cerebro-create-report") {
    chrome.tabs.sendMessage(tab.id, { action: "createReport", selection: info.selectionText || null });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "imageCaptured") {
    chrome.storage.local.set({ lastCapturedImage: msg.dataUrl });
  } else if (msg.action === "tablesExtracted") {
    chrome.storage.local.set({ lastExtractedTables: msg.tables, lastSelection: msg.selection });
  } else if (msg.action === "createGoogleSheet") {
    console.log("createGoogleSheet requested", msg.sheetSpec);
  }
});
EOF
