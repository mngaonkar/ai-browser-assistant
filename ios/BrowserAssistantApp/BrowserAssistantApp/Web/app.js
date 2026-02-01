const apiKeyInput = document.getElementById("apiKey");
const apiBaseInput = document.getElementById("apiBase");
const saveConfigButton = document.getElementById("saveConfig");
const configStatus = document.getElementById("configStatus");
const promptInput = document.getElementById("prompt");
const sendPromptButton = document.getElementById("sendPrompt");
const responseOutput = document.getElementById("response");

const STORAGE_KEY = "browserAssistantConfig";

const loadConfig = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return;
  }

  try {
    const config = JSON.parse(stored);
    apiKeyInput.value = config.apiKey || "";
    apiBaseInput.value = config.apiBase || "https://api.openai.com";
  } catch (error) {
    console.error("Failed to parse config", error);
  }
};

const saveConfig = () => {
  const config = {
    apiKey: apiKeyInput.value.trim(),
    apiBase: apiBaseInput.value.trim() || "https://api.openai.com",
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  configStatus.textContent = "Settings saved locally on this device.";
};

const callOpenAI = async ({ apiKey, apiBase, prompt }) => {
  const endpoint = `${apiBase.replace(/\/$/, "")}/v1/chat/completions`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant inside an iOS WebView. Keep responses concise.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.6,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Request failed.");
  }

  return response.json();
};

const handleSend = async () => {
  const apiKey = apiKeyInput.value.trim();
  const apiBase = apiBaseInput.value.trim() || "https://api.openai.com";
  const prompt = promptInput.value.trim();

  if (!apiKey) {
    responseOutput.textContent = "Please provide an API key.";
    return;
  }

  if (!prompt) {
    responseOutput.textContent = "Enter a prompt to send.";
    return;
  }

  responseOutput.textContent = "Sending request...";
  sendPromptButton.disabled = true;

  try {
    const data = await callOpenAI({ apiKey, apiBase, prompt });
    const message = data.choices?.[0]?.message?.content;
    responseOutput.textContent = message || "No response text returned.";
  } catch (error) {
    responseOutput.textContent = `Error: ${error.message}`;
  } finally {
    sendPromptButton.disabled = false;
  }
};

saveConfigButton.addEventListener("click", () => {
  saveConfig();
});

sendPromptButton.addEventListener("click", () => {
  handleSend();
});

loadConfig();
