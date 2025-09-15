// LangGraph Agent using actual LangChain packages
import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { MermaidDiagramTool } from "./mermaid-tool.js";
import { StateGraph, MessagesAnnotation } from "@langchain/langgraph/web";
import { Client } from "langsmith";
import { LangChainTracer } from "@langchain/core/tracers/tracer_langchain";

export class LangGraphAgent {
  constructor(apiKey, 
    baseUrl = 'https://api.openai.com/v1',
    langsmithApiKey = null,
    langsmithProject = 'browser-assistant') {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
    this.langsmithApiKey = langsmithApiKey;
    this.langsmithProject = langsmithProject;
    this.conversationHistory = [];
    this.pageContext = null;
    this.threadId = null;
    this.mermaidDiagramAgent = null;
    this.supervisor = null;
    this.initialized = false;
    this.tracer = null;
    
    // Set LangSmith environment variables immediately
    this.setLangSmithEnvironment();
  }

  // Set LangSmith environment variables
  setLangSmithEnvironment() {
    if (this.langsmithApiKey) {
      // Set environment variables for LangSmith tracing
      if (typeof process !== 'undefined') {
        process.env.LANGSMITH_TRACING = 'true';
        process.env.LANGSMITH_API_KEY = this.langsmithApiKey;
        process.env.LANGSMITH_PROJECT = this.langsmithProject;
      }
      
      // Also set in window object for browser environment
      if (typeof window !== 'undefined') {
        window.LANGSMITH_TRACING = 'true';
        window.LANGSMITH_API_KEY = this.langsmithApiKey;
        window.LANGSMITH_PROJECT = this.langsmithProject;
      }
      
      console.log('LangGraphAgent: LangSmith environment variables set');
    }
  }

  // Initialize the agent with page context
  async initialize(pageData, threadId = null) {
    try {
      this.pageContext = {
        url: pageData.url,
        title: pageData.title,
        content: pageData.content,
        timestamp: new Date().toISOString()
      };
      
      this.threadId = threadId || this.generateThreadId();
      
      // Clear previous conversation for new page
      this.conversationHistory = [];
      
      // Initialize the LangGraph agent
      await this.setupAgent();
      
      console.log('LangGraphAgent: Initialized with thread ID:', this.threadId);
      return this.threadId;
    } catch (error) {
      console.error('LangGraphAgent: Error initializing:', error);
      throw error;
    }
  }

  // Setup the LangGraph agent
  async setupAgent() {
    try {
      // Validate API key before creating LLM
      if (!this.apiKey) {
        throw new Error('API key is required but not provided');
      }

      // Create the LLM with LangSmith tracing
      const llmConfig = {
        apiKey: this.apiKey,
        model: 'gpt-4o-mini',
        temperature: 0.7,
        // maxTokens: 1000
      };

      // Add LangSmith tracer if available
      if (this.langsmithApiKey && this.tracer) {
        llmConfig.callbacks = [this.tracer];
      }

      console.log('LangGraphAgent: Creating LLM with config:', {
        apiKey: this.apiKey ? '***' + this.apiKey.slice(-4) : 'missing',
        model: llmConfig.model
      });

      let llm;
      try {
        llm = new ChatOpenAI(llmConfig);
        console.log('LangGraphAgent: LLM created successfully');
      } catch (llmCreateError) {
        console.error('LangGraphAgent: Failed to create LLM:', llmCreateError);
        throw new Error(`Failed to create LLM: ${llmCreateError.message}`);
      }

      // Test the LLM first
      console.log('LangGraphAgent: Testing LLM connection...');
      try {
        await llm.invoke([new HumanMessage("Test message")]);
        console.log('LangGraphAgent: LLM connection successful');
      } catch (llmError) {
        console.error('LangGraphAgent: LLM connection failed:', llmError);
        throw new Error(`LLM connection failed: ${llmError.message}`);
      }

      // Set up LangSmith tracer if API key is provided
      if (this.langsmithApiKey) {
        try {
          console.log('LangGraphAgent: Initializing LangSmith tracer...');
          this.tracer = new LangChainTracer({
            projectName: this.langsmithProject,
            client: new Client({
              apiUrl: "https://api.smith.langchain.com",
              apiKey: this.langsmithApiKey,
            }),
          });
          console.log('LangGraphAgent: LangSmith tracer initialized successfully');
        } catch (error) {
          console.warn('LangGraphAgent: Failed to initialize LangSmith tracer:', error);
          this.tracer = null;
        }
      } else {
        this.tracer = null;
        console.log('LangGraphAgent: LangSmith tracing disabled (no API key)');
      }

    // create react agent for summerize the content
    this.summerizeAgent = createReactAgent({
      llm: llm,
      tools: [],
      prompt: "you are a summerize agent and have access to the content of the page. \
      You summerize the content of the page to highlight the most important architecture and design patterns.",
    });
    console.log('LangGraphAgent: Summerize agent created successfully');

      // Create the agent executor with error handling
      try {
        // Try to create a simple agent without complex configuration
        // First check if the LLM has the required methods
        const mermaidTool = new MermaidDiagramTool();
        this.mermaidDiagramAgent = createReactAgent({
          llm: llm,
          tools: [mermaidTool], // Include Mermaid diagram tool
          prompt: "you are a mermaid diagram agent and have access to mermaid diagram tool. \
          You take mermaid code and render it into a diagram in HTML and only return valid HTML.",
        });
          console.log('LangGraphAgent: Agent executor created successfully');

      } catch (agentError) {
        console.error('LangGraphAgent: Failed to create agent executor:', agentError);
        // If agent creation fails, we'll use the LLM directly
        console.log('LangGraphAgent: Will use LLM directly instead of agent executor');
        this.mermaidDiagramAgent = null; // We'll handle this in processMessage
      }

      // Create the supervisor

    //   workflow = createSupervisor({
    //     agents: [this.mermaidDiagramAgent],
    //     llm: llm,
    //     prompt: "you are a browser assistant supervisor agent and have access to mermaid code agent and mermaid diagram agent. \
    //     For creating mermaid code from browser content, use the mermaid code agent. \
    //     For rendering the mermaid code, use the mermaid diagram agent.",
    //   });

      this.workflow = new StateGraph(MessagesAnnotation)
        .addNode("mermaid_diagram_agent", this.mermaidDiagramAgent)
        .addNode("summerize_agent", this.summerizeAgent)
        .addEdge("__start__", "summerize_agent")
        .addEdge("summerize_agent", "mermaid_diagram_agent")
        .addEdge("mermaid_diagram_agent", "__end__");

      this.supervisor = this.workflow.compile();
      console.log('LangGraphAgent: Supervisor created successfully');

      this.initialized = true;
      console.log('LangGraphAgent: Agent setup complete');
    } catch (error) {
      console.error('LangGraphAgent: Error setting up agent:', error);
      throw error;
    }
  }

  // Generate a unique thread ID for conversation persistence
  generateThreadId() {
    return 'thread_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Process a message using the LangGraph agent
  async processMessage(userMessage) {
    if (!this.initialized) {
      throw new Error('Agent not initialized. Call initialize() first.');
    }

    try {
      // Add user message to conversation history
      this.conversationHistory.push({
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      });

      // Create the message with page context
      const contextualMessage = this.createContextualMessage(userMessage);

      // Try to invoke the agent with proper error handling
      console.log('LangGraphAgent: Invoking agent with message:', contextualMessage);
      
      let result;
      if (this.supervisor) {
        try {
          // First try the standard invoke method
          const invokeOptions = {
            messages: [new HumanMessage(contextualMessage)]
          };
          
          // Add tracer if available
          if (this.tracer) {
            invokeOptions.callbacks = [this.tracer];
          }
          invokeOptions.verbose = true;
          
          console.log('LangGraphAgent: Invoking agent with options:', invokeOptions);
          result = await this.supervisor.invoke(invokeOptions);
        } catch (invokeError) {
          console.warn('LangGraphAgent: Standard invoke failed, trying alternative method:', invokeError);
        }
      } else {
        console.error('LangGraphAgent: Using LLM directly (agent is null)');
      }
      
    //   else {
    //     // Agent is null, use LLM directly
    //     console.log('LangGraphAgent: Using LLM directly (agent is null)');
    //     const llmConfig = {
    //       openAIApiKey: this.apiKey,
    //       modelName: 'gpt-3.5-turbo',
    //       temperature: 0.7,
    //       maxTokens: 1000
    //     };
        
    //     // Add tracer if available
    //     if (this.tracer) {
    //       llmConfig.callbacks = [this.tracer];
    //     }
        
    //     const llm = new ChatOpenAI(llmConfig);
    //     const llmResult = await llm.invoke([new HumanMessage(contextualMessage)]);
    //     result = { output: llmResult.content };
    //   }

      // Extract the response - handle different result formats
      let response;
      if (result && result.messages && result.messages.length > 0) {
        response = result.messages[result.messages.length - 1].content;
      } else if (result && result.output) {
        response = result.output;
      } else if (result && typeof result === 'string') {
        response = result;
      } else {
        console.error('LangGraphAgent: No response from agent');
      }
      
    //   else {
    //     // Fallback: use the LLM directly
    //     console.log('LangGraphAgent: Falling back to direct LLM call');
    //     const llmConfig = {
    //       openAIApiKey: this.apiKey,
    //       modelName: 'gpt-3.5-turbo',
    //       temperature: 0.7,
    //       maxTokens: 1000
    //     };
        
    //     // Add tracer if available
    //     if (this.tracer) {
    //       llmConfig.callbacks = [this.tracer];
    //     }
        
    //     const llm = new ChatOpenAI(llmConfig);
    //     const llmResult = await llm.invoke([new HumanMessage(contextualMessage)]);
    //     response = llmResult.content;
    //   }

      console.log('LangGraphAgent: Received response:', response);

      // Add response to conversation history
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString()
      });

      return response;
    } catch (error) {
      console.error('LangGraphAgent: Error processing message:', error);
      
      // Fallback to simple LLM call if agent fails
    //   try {
    //     console.log('LangGraphAgent: Attempting fallback LLM call');
    //     const llmConfig = {
    //       openAIApiKey: this.apiKey,
    //       modelName: 'gpt-3.5-turbo',
    //       temperature: 0.7,
    //       maxTokens: 1000
    //     };
        
    //     // Add tracer if available
    //     if (this.tracer) {
    //       llmConfig.callbacks = [this.tracer];
    //     }
        
    //     const llm = new ChatOpenAI(llmConfig);
    //     const contextualMessage = this.createContextualMessage(userMessage);
    //     const llmResult = await llm.invoke([new HumanMessage(contextualMessage)]);
    //     const response = llmResult.content;
        
    //     // Add response to conversation history
    //     this.conversationHistory.push({
    //       role: 'assistant',
    //       content: response,
    //       timestamp: new Date().toISOString()
    //     });
        
    //     return response;
    //   } catch (fallbackError) {
    //     console.error('LangGraphAgent: Fallback also failed:', fallbackError);
    //     throw new Error(`Agent processing failed: ${error.message}. Fallback also failed: ${fallbackError.message}`);
    //   }
    }
  }

  // Create a contextual message that includes page information
  createContextualMessage(userMessage) {
    return `You are a helpful browser assistant. The user is currently on this webpage:

URL: ${this.pageContext.url}
Title: ${this.pageContext.title}
Content: ${this.pageContext.content}

User's question: ${userMessage}

Please provide a helpful response based on the webpage content and the user's question. If the question is not related to the current page, you can still help but mention that you're not sure about the current page context.

Previous conversation:
${this.conversationHistory.map(h => `${h.role}: ${h.content}`).join('\n')}`;
  }

  // Get conversation history
  getConversationHistory() {
    return this.conversationHistory;
  }

  // Get current thread ID
  getThreadId() {
    return this.threadId;
  }

  // Clear conversation history
  clearHistory() {
    this.conversationHistory = [];
    console.log('LangGraphAgent: Conversation history cleared');
  }

  // Export conversation for analysis
  exportConversation() {
    return {
      threadId: this.threadId,
      pageContext: this.pageContext,
      conversationHistory: this.conversationHistory,
      exportDate: new Date().toISOString()
    };
  }

  // Get agent status
  getStatus() {
    return {
      isInitialized: this.initialized,
      threadId: this.threadId,
      messageCount: this.conversationHistory.length,
      lastActivity: this.conversationHistory.length > 0 ? 
        this.conversationHistory[this.conversationHistory.length - 1].timestamp : null
    };
  }
}
