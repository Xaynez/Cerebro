cat > extension/aiClient.js <<'EOF'
async function callLocalPromptAPI(payload) {
  try {
    // When Chrome built-in AI preview is available, replace this block
    if (typeof chrome !== "undefined" && chrome.ai && chrome.ai.prompt) {
      const response = await chrome.ai.prompt({
        model: "gemini-nano",
        prompt: payload.input,
        multimodal: payload.multimodal || undefined,
        maxTokens: payload.maxTokens || 800
      });
      if (response && response.output) return response.output;
      if (response && response.text) return response.text;
      return JSON.stringify(response);
    }
  } catch (err) {
    console.warn("Local AI call failed", err);
  }
  // Mock fallback until preview access: deterministic helpful placeholder
  const mock = `MOCK AI RESPONSE\n\nInput preview:\n${(payload.input || "").slice(0, 1200)}\n\n(Replace callLocalPromptAPI with the real chrome built-in API call when you have access.)`;
  await new Promise(r => setTimeout(r, 400));
  return mock;
}
EOF
