// Popup script for the browser assistant extension

document.addEventListener('DOMContentLoaded', async () => {
  // Load saved configuration
  await loadConfig();
  
  // Set up event listeners
  document.getElementById('saveConfig').addEventListener('click', saveConfig);
  document.getElementById('testConfig').addEventListener('click', testConfig);
  document.getElementById('openAssistant').addEventListener('click', openAssistant);
  document.getElementById('analyzePage').addEventListener('click', analyzePage);
});

async function loadConfig() {
  try {
    const result = await chrome.storage.sync.get(['apiKey', 'baseUrl', 'langsmithApiKey', 'langsmithProject']);
    if (result.apiKey) {
      document.getElementById('apiKey').value = result.apiKey;
    }
    if (result.baseUrl) {
      document.getElementById('baseUrl').value = result.baseUrl;
    }
    if (result.langsmithApiKey) {
      document.getElementById('langsmithApiKey').value = result.langsmithApiKey;
    }
    if (result.langsmithProject) {
      document.getElementById('langsmithProject').value = result.langsmithProject;
    }
  } catch (error) {
    console.error('Error loading config:', error);
    showStatus('Error loading configuration', 'error');
  }
}

async function saveConfig() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const baseUrl = document.getElementById('baseUrl').value.trim();
  const langsmithApiKey = document.getElementById('langsmithApiKey').value.trim();
  const langsmithProject = document.getElementById('langsmithProject').value.trim();
  
  if (!apiKey) {
    showStatus('Please enter an API key', 'error');
    return;
  }
  
  showStatus('Saving configuration...', 'success');
  
  try {
    // Check if Chrome runtime is available
    if (!chrome.runtime) {
      throw new Error('Chrome runtime not available');
    }
    
    // Send message to background script
    const response = await chrome.runtime.sendMessage({
      action: 'setApiKey',
      apiKey: apiKey,
      baseUrl: baseUrl,
      langsmithApiKey: langsmithApiKey,
      langsmithProject: langsmithProject
    });
    
    console.log('Save config response:', response);
    
    if (response && response.success) {
      showStatus('Configuration saved successfully!', 'success');
    } else if (response && response.error) {
      throw new Error(response.error);
    } else {
      showStatus('Configuration saved successfully!', 'success');
    }
  } catch (error) {
    console.error('Error saving config:', error);
    showStatus(`Error saving configuration: ${error.message}`, 'error');
  }
}

async function testConfig() {
  const apiKey = document.getElementById('apiKey').value.trim();
  const baseUrl = document.getElementById('baseUrl').value.trim();
  
  if (!apiKey) {
    showStatus('Please enter an API key first', 'error');
    return;
  }
  
  showStatus('Testing configuration...', 'success');
  
  try {
    // Test the API key with a simple request
    const response = await fetch(`${baseUrl}/models`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      showStatus('Configuration test successful!', 'success');
    } else {
      showStatus(`Configuration test failed: ${response.status}`, 'error');
    }
  } catch (error) {
    console.error('Error testing config:', error);
    showStatus('Configuration test failed: ' + error.message, 'error');
  }
}

async function openAssistant() {
  try {
    console.log('Popup: Opening assistant...');
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('Popup: Current tab:', tab);
    
    // Send message to content script to toggle assistant
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'toggleAssistant' });
    console.log('Popup: Message sent, response:', response);
    
    // Close the popup
    window.close();
  } catch (error) {
    console.error('Error opening assistant:', error);
    showStatus('Error opening assistant. Make sure you\'re on a valid webpage. Error: ' + error.message, 'error');
  }
}

async function analyzePage() {
  try {
    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script to analyze page
    await chrome.tabs.sendMessage(tab.id, { action: 'analyzePage' });
    
    showStatus('Page analysis started. Check the assistant panel.', 'success');
  } catch (error) {
    console.error('Error analyzing page:', error);
    showStatus('Error analyzing page. Make sure you\'re on a valid webpage.', 'error');
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('status');
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  statusDiv.style.display = 'block';
  
  // Hide status after 3 seconds
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}
