// Content script for injecting the assistant panel
class BrowserAssistant {
  constructor() {
    this.isOpen = false;
    this.assistantPanel = null;
    this.threadId = null;
    this.init();
  }

  init() {
    console.log('BrowserAssistant: Initializing...');
    
    // Listen for messages from popup or background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('BrowserAssistant: Received message:', request);
      if (request.action === 'toggleAssistant') {
        console.log('BrowserAssistant: Toggling assistant...');
        this.toggleAssistant();
        sendResponse({ success: true });
      } else if (request.action === 'analyzePage') {
        console.log('BrowserAssistant: Analyzing page...');
        this.analyzeCurrentPage();
        sendResponse({ success: true });
      }
      return true; // Keep message channel open for async response
    });

    // Create the assistant panel
    this.createAssistantPanel();
    console.log('BrowserAssistant: Initialization complete');
  }

  createAssistantPanel() {
    // Create the main container
    this.assistantPanel = document.createElement('div');
    this.assistantPanel.id = 'browser-assistant-panel';
    this.assistantPanel.style.cssText = `
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: #ffffff;
      border-left: 1px solid #e0e0e0;
      box-shadow: -2px 0 10px rgba(0,0,0,0.1);
      z-index: 10000;
      transition: right 0.3s ease;
      display: flex;
      flex-direction: column;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    // Create the header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 16px;
      border-bottom: 1px solid #e0e0e0;
      background: #f8f9fa;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;
    header.innerHTML = `
      <h3 style="margin: 0; color: #333; font-size: 16px;">Browser Assistant</h3>
      <button id="close-assistant" style="background: none; border: none; font-size: 18px; cursor: pointer; color: #666;">&times;</button>
    `;

    // Create the chat container
    const chatContainer = document.createElement('div');
    chatContainer.id = 'chat-container';
    chatContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    // Create the input area
    const inputArea = document.createElement('div');
    inputArea.style.cssText = `
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      background: #f8f9fa;
    `;
    inputArea.innerHTML = `
      <div style="display: flex; gap: 8px;">
        <input type="text" id="message-input" placeholder="Ask me about this page..." 
               style="flex: 1; padding: 8px 12px; border: 1px solid #ddd; border-radius: 20px; outline: none;">
        <button id="send-message" style="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 20px; cursor: pointer;">Send</button>
      </div>
    `;

    // Assemble the panel
    this.assistantPanel.appendChild(header);
    this.assistantPanel.appendChild(chatContainer);
    this.assistantPanel.appendChild(inputArea);

    // Add to page first
    document.body.appendChild(this.assistantPanel);

    // Add event listeners after elements are in the DOM
    const closeButton = document.getElementById('close-assistant');
    const sendButton = document.getElementById('send-message');
    const messageInput = document.getElementById('message-input');

    if (closeButton) {
      closeButton.addEventListener('click', () => this.toggleAssistant());
    } else {
      console.error('BrowserAssistant: Close button not found');
    }

    if (sendButton) {
      sendButton.addEventListener('click', () => this.sendMessage());
    } else {
      console.error('BrowserAssistant: Send button not found');
    }

    if (messageInput) {
      messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.sendMessage();
      });
    } else {
      console.error('BrowserAssistant: Message input not found');
    }
  }

  toggleAssistant() {
    console.log('BrowserAssistant: Toggle called, current state:', this.isOpen);
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      console.log('BrowserAssistant: Opening panel...');
      this.assistantPanel.style.right = '0';
      this.analyzeCurrentPage();
    } else {
      console.log('BrowserAssistant: Closing panel...');
      this.assistantPanel.style.right = '-400px';
    }
  }

  async analyzeCurrentPage() {
    const chatContainer = document.getElementById('chat-container');
    
    // Add loading message
    this.addMessage('assistant', 'Analyzing this page...', true);
    
    try {
      // Check if Chrome runtime is available
      if (!chrome.runtime) {
        throw new Error('Chrome runtime not available');
      }

      // Get page content
      const pageData = {
        url: window.location.href,
        title: document.title,
        content: document.body.innerText.substring(0, 5000), // Limit content size
        timestamp: new Date().toISOString()
      };

      console.log('Content script: Sending analyzePage message', pageData);

      // Send to background script for processing
      const response = await chrome.runtime.sendMessage({
        action: 'analyzePage',
        data: pageData
      });

      console.log('Content script: Received response', response);

      // Remove loading message and add analysis
      chatContainer.removeChild(chatContainer.lastChild);
      this.addMessage('assistant', response.summary || 'Page analysis complete!');
      
    } catch (error) {
      console.error('Error analyzing page:', error);
      chatContainer.removeChild(chatContainer.lastChild);
      
      // Provide more specific error messages
      let errorMessage = 'Sorry, I encountered an error while analyzing the page.';
      
      if (error.message.includes('Could not establish connection')) {
        errorMessage = 'Unable to connect to the background service. Please reload the extension and try again.';
      } else if (error.message.includes('Chrome runtime not available')) {
        errorMessage = 'Extension runtime not available. Please check if the extension is properly loaded.';
      } else if (error.message.includes('Receiving end does not exist')) {
        errorMessage = 'Background script not running. Please reload the extension.';
      }
      
      this.addMessage('assistant', errorMessage);
    }
  }

  async sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;

    // Add user message to chat
    this.addMessage('user', message);
    input.value = '';

    // Add loading message
    this.addMessage('assistant', 'Thinking...', true);

    try {
      // Check if Chrome runtime is available
      if (!chrome.runtime) {
        throw new Error('Chrome runtime not available');
      }

      // Get or create thread ID for this conversation
      if (!this.threadId) {
        this.threadId = 'thread_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      }

      console.log('Content script: Sending chat message', { message, threadId: this.threadId });

      // Send message to background script
      const response = await chrome.runtime.sendMessage({
        action: 'chatMessage',
        message: message,
        threadId: this.threadId,
        pageData: {
          url: window.location.href,
          title: document.title,
          content: document.body.innerText.substring(0, 5000)
        }
      });

      console.log('Content script: Received chat response', response);

      // Remove loading message and add response
      const chatContainer = document.getElementById('chat-container');
      chatContainer.removeChild(chatContainer.lastChild);
      this.addMessage('assistant', response.response || 'Sorry, I couldn\'t process your message.');
      
    } catch (error) {
      console.error('Error sending message:', error);
      const chatContainer = document.getElementById('chat-container');
      chatContainer.removeChild(chatContainer.lastChild);
      
      // Provide more specific error messages
      let errorMessage = 'Sorry, I encountered an error processing your message.';
      
      if (error.message.includes('Could not establish connection')) {
        errorMessage = 'Unable to connect to the background service. Please reload the extension and try again.';
      } else if (error.message.includes('Chrome runtime not available')) {
        errorMessage = 'Extension runtime not available. Please check if the extension is properly loaded.';
      } else if (error.message.includes('Receiving end does not exist')) {
        errorMessage = 'Background script not running. Please reload the extension.';
      }
      
      this.addMessage('assistant', errorMessage);
    }
  }


  // Safe HTML insertion that works with CSP
  setHTMLAndRunScripts(container, html) {
    container.innerHTML = html; // scripts inside won't run yet
   
    // Find inert scripts and replace with real ones
    container.querySelectorAll('script').forEach(oldScript => {
      const s = document.createElement('script');
      // copy attributes (src, type, async, defer, nonce, etc.)
      for (const { name, value } of oldScript.attributes) s.setAttribute(name, value);
      // inline code
      if (!s.src) s.textContent = oldScript.textContent;
      oldScript.replaceWith(s); // inserting the *new* script executes it
    });
  }

  // Check if content contains Mermaid diagrams
  containsMermaidDiagram(content) {
    return content.includes('mermaid') || 
           content.includes('graph') || 
           content.includes('flowchart') || 
           content.includes('sequenceDiagram') ||
           content.includes('classDiagram') ||
           content.includes('stateDiagram') ||
           content.includes('erDiagram') ||
           content.includes('journey') ||
           content.includes('gantt') ||
           content.includes('pie') ||
           content.includes('gitgraph');
  }

  // Create a download link for HTML content
  createDownloadLink(htmlContent, filename) {
    // Create a complete HTML document with Mermaid support
    const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mermaid Diagram</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .mermaid-diagram {
            margin: 20px 0;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
            background: #fafafa;
        }
        .mermaid-code {
            margin-bottom: 20px;
        }
        .mermaid-code pre {
            background: #f8f8f8;
            padding: 15px;
            border-radius: 4px;
            overflow-x: auto;
            border: 1px solid #e0e0e0;
        }
        .mermaid-container {
            text-align: center;
        }
        .mermaid-error {
            color: #d32f2f;
            background: #ffebee;
            padding: 10px;
            border-radius: 4px;
            border: 1px solid #ffcdd2;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Mermaid Diagram</h1>
        ${htmlContent}
    </div>
    
    <script src="https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js"></script>
    <script>
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            themeVariables: {
                primaryColor: '#007bff',
                primaryTextColor: '#333',
                primaryBorderColor: '#007bff',
                lineColor: '#333',
                secondaryColor: '#f8f9fa',
                tertiaryColor: '#fff'
            }
        });
    </script>
</body>
</html>`;

    // Create a blob and download link
    const blob = new Blob([fullHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    return `
      <div style="
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 15px;
        margin: 10px 0;
        background: #f9f9f9;
        text-align: center;
      ">
        <p style="margin: 0 0 10px 0; color: #666;">This content contains Mermaid diagrams</p>
        <a href="${url}" download="${filename}" style="
          display: inline-block;
          padding: 10px 20px;
          background: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: bold;
        ">
          💾 Download HTML
        </a>
      </div>
    `;
  }

  addMessage(sender, content, isLoading = false) {
    const chatContainer = document.getElementById('chat-container');
    const messageDiv = document.createElement('div');
    
    messageDiv.style.cssText = `
      padding: 12px;
      border-radius: 12px;
      max-width: 80%;
      word-wrap: break-word;
      ${sender === 'user' 
        ? 'background: #007bff; color: white; align-self: flex-end; margin-left: auto;' 
        : 'background: #f1f3f4; color: #333; align-self: flex-start;'
      }
    `;

    if (isLoading) {
      messageDiv.innerHTML = `
        <div style="display: flex; align-items: center; gap: 8px;">
          <div style="width: 20px; height: 20px; border: 2px solid #ccc; border-top: 2px solid #007bff; border-radius: 50%; animation: spin 1s linear infinite;"></div>
          <span>${content}</span>
        </div>
      `;
    } else {
      // Render markdown for assistant messages, plain text for user messages
      if (sender === 'assistant') {
        console.log('Content script: Content before rendering:', content);
        content = this.renderMarkdown(content);
        console.log('Content script: Rendered markdown for assistant:', content);
        
        // Check if content contains Mermaid diagrams
        if (this.containsMermaidDiagram(content)) {
          // Create a download link for Mermaid diagrams
          const downloadLink = this.createDownloadLink(content, 'mermaid-diagram.html');
          messageDiv.innerHTML = downloadLink;
        } else {
          // Regular content - display normally
          messageDiv.innerHTML = content;
        }

      } else {
        messageDiv.textContent = content;
      }
    }

    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
  }

  // Simple markdown renderer
  renderMarkdown(text) {
    if (!text) return '';
    
    // console.log('Content script: Rendering markdown:', text);

    // Check if this is HTML content wrapped in markdown code blocks
    const htmlCodeBlockMatch = text.match(/```html\s*([\s\S]*?)\s*```/);
    if (htmlCodeBlockMatch) {
      // Extract HTML content from code block and return it directly
      console.log('Content script: Detected HTML code block, rendering as HTML');
      // console.log('Content script: HTML code block:', htmlCodeBlockMatch[1].trim());
      return htmlCodeBlockMatch[1].trim();
    }
    
    // Check for other code block formats that might contain HTML
    const codeBlockMatch = text.match(/```\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      const codeContent = codeBlockMatch[1].trim();
      // Check if the code content looks like HTML
      if (codeContent.includes('<div') || codeContent.includes('<script') || 
          codeContent.includes('<html') || codeContent.includes('<!DOCTYPE') ||
          codeContent.includes('<svg') || codeContent.includes('class=')) {
        console.log('Content script: Detected HTML in code block, rendering as HTML');
        return codeContent;
      }
    }
    
    // Check if this is HTML content (like from Mermaid tool)
    if (text.includes('<div class="mermaid-diagram">') || text.includes('<script>') || text.includes('<html>') || text.includes('<!DOCTYPE')) {
      // This is HTML content, return it directly without escaping
      console.log('Content script: Detected HTML content, rendering as HTML');
      return text;
    }
    
    // Escape HTML first for regular markdown content
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // Convert markdown to HTML
    html = html
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>')
      // Lists
      .replace(/^\* (.*$)/gim, '<li>$1</li>')
      .replace(/^- (.*$)/gim, '<li>$1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
    
    // Wrap consecutive list items in ul/ol
    html = html.replace(/(<li>.*<\/li>)/g, (match) => {
      if (match.includes('<ul>') || match.includes('<ol>')) return match;
      return '<ul>' + match + '</ul>';
    });
    
    return html;
  }

}

// Initialize the assistant when the page loads
function initializeAssistant() {
  console.log('Content script: Initializing assistant...');
  try {
    window.browserAssistant = new BrowserAssistant();
    console.log('Content script: Assistant initialized successfully');
  } catch (error) {
    console.error('Content script: Error initializing assistant:', error);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAssistant);
} else {
  initializeAssistant();
}

// Also try to initialize after a short delay as a fallback
setTimeout(() => {
  if (!window.browserAssistant) {
    console.log('Content script: Fallback initialization...');
    initializeAssistant();
  }
}, 1000);

// Add CSS animation for loading spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);
