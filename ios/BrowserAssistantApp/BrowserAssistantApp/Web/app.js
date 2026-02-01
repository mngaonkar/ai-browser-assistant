const STORAGE_KEY = "browserAssistantConfig";

const createPageTemplates = () => {
  customElements.define(
    "page-chat",
    class extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <ion-page>
            <ion-header>
              <ion-toolbar color="primary">
                <ion-title>Browser Assistant</ion-title>
                <ion-buttons slot="end">
                  <ion-button href="#/settings">Settings</ion-button>
                </ion-buttons>
              </ion-toolbar>
            </ion-header>
            <ion-content>
              <ion-card class="hero-card">
                <ion-card-header>
                  <ion-card-title>Conversation</ion-card-title>
                  <ion-card-subtitle>Ask questions about the current page or topic.</ion-card-subtitle>
                </ion-card-header>
                <ion-card-content>
                  <ion-item lines="full">
                    <ion-label position="stacked">Prompt</ion-label>
                    <ion-textarea
                      id="prompt"
                      auto-grow="true"
                      placeholder="Summarize this page or ask a question."
                    ></ion-textarea>
                  </ion-item>
                  <ion-button id="sendPrompt" expand="block" class="full-width">Send</ion-button>
                  <div class="response-box" id="response" aria-live="polite"></div>
                </ion-card-content>
              </ion-card>
            </ion-content>
          </ion-page>
        `;
      }
    }
  );

  customElements.define(
    "page-settings",
    class extends HTMLElement {
      connectedCallback() {
        this.innerHTML = `
          <ion-page>
            <ion-header>
              <ion-toolbar color="primary">
                <ion-title>Settings</ion-title>
                <ion-buttons slot="start">
                  <ion-back-button default-href="#/"></ion-back-button>
                </ion-buttons>
              </ion-toolbar>
            </ion-header>
            <ion-content>
              <ion-card class="hero-card">
                <ion-card-header>
                  <ion-card-title>API Configuration</ion-card-title>
                  <ion-card-subtitle>Saved locally on this device.</ion-card-subtitle>
                </ion-card-header>
                <ion-card-content>
                  <ion-item lines="full">
                    <ion-label position="stacked">OpenAI API Key</ion-label>
                    <ion-input id="apiKey" type="password" placeholder="sk-..."></ion-input>
                  </ion-item>
                  <ion-item lines="full">
                    <ion-label position="stacked">API Base URL</ion-label>
                    <ion-input id="apiBase" type="text" value="https://api.openai.com"></ion-input>
                  </ion-item>
                  <ion-button id="saveConfig" expand="block" class="full-width">Save Settings</ion-button>
                  <p id="configStatus" class="status-text"></p>
                </ion-card-content>
              </ion-card>
            </ion-content>
          </ion-page>
        `;
      }
    }
  );
};

const loadConfig = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return { apiKey: "", apiBase: "https://api.openai.com" };
  }

  try {
    const config = JSON.parse(stored);
    return {
      apiKey: config.apiKey || "",
      apiBase: config.apiBase || "https://api.openai.com",
    };
  } catch (error) {
    console.error("Failed to parse config", error);
    return { apiKey: "", apiBase: "https://api.openai.com" };
  }
};

const saveConfig = (config) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
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

const bindSettings = () => {
  const config = loadConfig();
  const apiKeyInput = document.getElementById("apiKey");
  const apiBaseInput = document.getElementById("apiBase");
  const saveConfigButton = document.getElementById("saveConfig");
  const configStatus = document.getElementById("configStatus");

  if (!apiKeyInput || !apiBaseInput || !saveConfigButton) {
    return;
  }

  apiKeyInput.value = config.apiKey;
  apiBaseInput.value = config.apiBase;

  saveConfigButton.addEventListener("click", () => {
    const nextConfig = {
      apiKey: apiKeyInput.value.trim(),
      apiBase: apiBaseInput.value.trim() || "https://api.openai.com",
    };

    saveConfig(nextConfig);
    configStatus.textContent = "Settings saved locally on this device.";
  });
};

const bindChat = () => {
  const sendPromptButton = document.getElementById("sendPrompt");
  const promptInput = document.getElementById("prompt");
  const responseOutput = document.getElementById("response");

  if (!sendPromptButton || !promptInput || !responseOutput) {
    return;
  }

  sendPromptButton.addEventListener("click", async () => {
    const { apiKey, apiBase } = loadConfig();
    const prompt = promptInput.value.trim();

    if (!apiKey) {
      responseOutput.textContent = "Please provide an API key in settings.";
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
  });
};

const handleRouteChange = () => {
  const hash = window.location.hash.replace("#/", "");
  if (hash.startsWith("settings")) {
    bindSettings();
  } else {
    bindChat();
  }
};

createPageTemplates();

window.addEventListener("hashchange", handleRouteChange);
window.addEventListener("load", handleRouteChange);
