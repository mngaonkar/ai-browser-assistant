# Browser Assistant Chrome Extension

A Chrome extension that provides an AI-powered assistant panel for analyzing web pages and answering questions about their content. The extension integrates with OpenAI's API to provide intelligent page summaries and chat functionality.

## Features

- **Right-side Assistant Panel**: A sleek, slide-out panel that appears on the right side of any webpage
- **Page Analysis**: Automatically analyzes the current page and provides a summary
- **Chat Interface**: Interactive chat functionality to ask questions about the page content
- **LangGraph Integration**: Advanced agentic framework for intelligent conversation management
- **Query Classification**: Automatically categorizes user queries (search, analysis, summary, explanation)
- **Conversation History**: Maintains context across multiple interactions
- **Thread-based Conversations**: Persistent conversation threads for better context
- **OpenAI Integration**: Uses OpenAI's GPT models for intelligent responses
- **Easy Configuration**: Simple setup through the extension popup

## Installation

### Method 1: Quick Install (Recommended)

1. Clone or download this repository
2. Run the installation script: `./install-dependencies.sh`
3. This will install dependencies, build the extension, and provide next steps

### Method 2: Manual Install

1. Install dependencies: `npm install`
2. Build the extension: `npm run build`
3. Open Chrome and navigate to `chrome://extensions/`
4. Enable "Developer mode" in the top right corner
5. Click "Load unpacked" and select the `dist` folder
6. The extension should now appear in your extensions list

## Configuration

1. Click on the extension icon in your Chrome toolbar
2. Enter your OpenAI API key in the "API Key" field
3. Optionally customize the API base URL (defaults to OpenAI)
4. Click "Save" to store your configuration
5. Click "Test" to verify your API key works

### Getting an OpenAI API Key

1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Sign in or create an account
3. Create a new API key
4. Copy the key and paste it into the extension settings

## Usage

### Opening the Assistant

1. Navigate to any webpage
2. Click the extension icon in your toolbar
3. Click "Open Assistant" to toggle the assistant panel
4. The panel will slide in from the right side

### Page Analysis

- The assistant automatically analyzes the current page when opened
- You can also click "Analyze Page" in the popup to re-analyze
- The analysis includes a summary, key topics, and insights

### Chat Functionality

- Type questions in the input field at the bottom of the assistant panel
- Press Enter or click "Send" to submit your question
- The assistant will respond based on the current page content
- You can ask about specific information, request summaries, or get explanations

## File Structure

```
browser-assistant/
├── src/                   # Source files
│   ├── background.js      # Background script with LangGraph integration
│   ├── content.js         # Content script for page injection
│   ├── popup.js           # Popup functionality
│   └── langgraph-agent.js # LangGraph agent implementation
├── dist/                  # Built extension (load this in Chrome)
├── manifest.json          # Extension manifest
├── popup.html             # Extension popup interface
├── content.css            # Styles for the assistant panel
├── package.json           # Project configuration
├── webpack.config.js      # Build configuration
└── README.md              # This file
```

## Technical Details

### Architecture

- **Content Script**: Injects the assistant panel into web pages
- **Background Script**: Handles API calls and message routing
- **Popup**: Provides configuration interface
- **OpenAI Integration**: Uses GPT-3.5-turbo for text generation

### API Integration

The extension uses OpenAI's Chat Completions API with the following features:
- Model: GPT-3.5-turbo
- Max tokens: 1000
- Temperature: 0.7
- System prompt for consistent behavior

### LangGraph Integration

The extension includes a sophisticated LangGraph agent implementation:

- **Query Classification**: Automatically categorizes user questions (search, analysis, summary, explanation, general)
- **Structured Responses**: Different response types based on query classification
- **Conversation History**: Maintains context across interactions
- **Thread Management**: Persistent conversation threads for better context
- **Page Context Awareness**: Uses page content for intelligent responses
- **Agent Status Tracking**: Monitor agent state and conversation history
- **Error Handling**: Robust error handling with fallback mechanisms

### Security

- API keys are stored securely in Chrome's sync storage
- No data is sent to external servers except OpenAI
- Page content is limited to 5000 characters for privacy

## Customization

### Styling

You can customize the appearance by modifying `content.css`:
- Colors and themes
- Panel size and position
- Font styles and sizes
- Animation effects

### API Configuration

The extension supports different API providers:
- OpenAI (default)
- Azure OpenAI
- Other OpenAI-compatible APIs

### Content Processing

Modify `background.js` to customize:
- Page content extraction
- Prompt engineering
- Response processing
- Error handling

## Troubleshooting

### Common Issues

1. **Assistant not opening**: Make sure you're on a valid webpage (not chrome:// pages)
2. **API errors**: Check your API key and internet connection
3. **Panel not visible**: Try refreshing the page and reopening the assistant
4. **Configuration not saving**: Check Chrome's storage permissions

### Debug Mode

1. Open Chrome DevTools (F12)
2. Go to the Console tab
3. Look for error messages from the extension
4. Check the Network tab for API call failures

## Development

### Prerequisites

- Chrome browser
- OpenAI API key
- Basic knowledge of JavaScript and Chrome extensions

### Making Changes

1. Modify the relevant files
2. Go to `chrome://extensions/`
3. Click the refresh button on your extension
4. Test your changes

### Building

```bash
# Package the extension
npm run package

# This creates browser-assistant.zip
```

## License

MIT License - see LICENSE file for details

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
1. Check the troubleshooting section
2. Look at the console for error messages
3. Create an issue in the repository
4. Provide details about your setup and the problem

## Roadmap

- [ ] Support for more AI providers
- [ ] Enhanced page content extraction
- [ ] Conversation history
- [ ] Custom prompts and templates
- [ ] Multi-language support
- [ ] Voice input/output
- [ ] Page screenshot analysis
