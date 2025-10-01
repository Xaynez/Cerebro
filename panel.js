cat > extension/panel.js <<'EOF'
const output = document.getElementById("output");
const promptInput = document.getElementById("prompt");

document.getElementById("synthesize").addEventListener("click", async () => {
  output.innerText = "Collecting text from open tabs...";
  const tabs = await chrome.tabs.query({ currentWindow: true });
  const docs = [];
  for (const t of tabs.slice(0, 6)) {
    try {
      const res = await chrome.scripting.executeScript({
        target: { tabId: t.id },
        func: () => {
          return { title: document.title, url: location.href, text: document.body.innerText.slice(0, 40000) };
        }
      });
      if (res && res[0] && res[0].result) {
        docs.push({ title: res[0].result.title, url: res[0].result.url, text: res[0].result.text });
      }
    } catch (e) {
      console.warn("script execute failed on tab", t.id, e);
    }
  }
  output.innerText = `Collected ${docs.length} documents. Requesting synthesis from local AI...`;

  const prompt = `You are an expert summarizer. Synthesize the following documents into a structured report with (1) a 3-sentence executive summary, (2) 5 key bullet insights, (3) 3 recommended next steps. Include source citations as [Title - domain].\n\n${docs.map(d => `Title: ${d.title}\nURL: ${d.url}\n\n${d.text}`).join("\n\n---\n\n")}`;

  try {
    const aiResult = await callLocalPromptAPI({ input: prompt, maxTokens: 600 });
    output.innerText = aiResult;
  } catch (err) {
    output.innerText = "AI call failed: " + String(err);
  }
});

document.getElementById("explainImage").addEventListener("click", async () => {
  output.innerText = "Fetching last captured image...";
  chrome.storage.local.get(["lastCapturedImage"], async (res) => {
    const dataUrl = res.lastCapturedImage;
    if (!dataUrl) {
      output.innerText = "No captured image found. Right-click an image in any page and choose 'Cerebro: Explain image' first.";
      return;
    }
    output.innerText = "Calling local AI to explain the image...";
    try {
      const aiResult = await callLocalPromptAPI({
        input: "Explain this diagram or chart. Provide: (1) one-sentence summary, (2) three takeaway bullets, (3) one suggested follow-up question.",
        multimodal: { images: [dataUrl] },
        maxTokens: 400
      });
      output.innerText = aiResult;
    } catch (err) {
      output.innerText = "AI image explain failed: " + String(err);
    }
  });
});

document.getElementById("createSheet").addEventListener("click", async () => {
  const prompt = promptInput.value || "Create a 12-month SaaS financial model with MRR $25,000 and 15% monthly growth";
  output.innerText = "Requesting sheet spec from AI...";
  try {
    const sheetSpecJson = await callLocalPromptAPI({
      input: `You are an expert financial analyst. Return only a JSON object describing a Google Sheet structure (title, sheets -> name, headers, rows sample, formulas) for this request:\n\n${prompt}`,
      maxTokens: 800
    });
    output.innerText = "Sheet spec received (raw):\n\n" + sheetSpecJson;
    let spec;
    try {
      spec = JSON.parse(sheetSpecJson);
    } catch (e) {
      output.innerText += "\n\nCould not parse JSON. If this was the real API, replace the prompt to strictly return JSON.";
      return;
    }
    chrome.runtime.sendMessage({ action: "createGoogleSheet", sheetSpec: spec });
  } catch (err) {
    output.innerText = "AI sheet spec failed: " + String(err);
  }
});
EOF
