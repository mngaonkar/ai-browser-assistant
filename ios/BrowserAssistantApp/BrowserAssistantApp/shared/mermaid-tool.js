// Mermaid diagram tool for LangGraph agent
import { Tool } from "@langchain/core/tools";

export class MermaidDiagramTool extends Tool {
  constructor() {
    super();
    this.name = "mermaid_diagram";
    this.description = "Create a Mermaid diagram from code. Use this when users ask for diagrams, flowcharts, sequence diagrams, class diagrams, or any visual representation. Input should be Mermaid diagram code.";
    this.mermaidLoaded = false;
  }

  async _call(input) {
    try {
      // Validate that the input looks like Mermaid code
      const mermaidCode = input.trim();
      
      if (!mermaidCode) {
        return "Error: No Mermaid code provided. Please provide valid Mermaid diagram code.";
      }

      // Basic validation for Mermaid syntax
      const validMermaidTypes = [
        'graph', 'flowchart', 'sequenceDiagram', 'classDiagram', 
        'stateDiagram', 'erDiagram', 'journey', 'gantt', 'pie', 'gitgraph'
      ];
      
      const hasValidType = validMermaidTypes.some(type => 
        mermaidCode.toLowerCase().includes(type.toLowerCase())
      );
      
      if (!hasValidType) {
        return `Error: Invalid Mermaid syntax. Please start with one of these diagram types: ${validMermaidTypes.join(', ')}`;
      }

      // Create a unique ID for the diagram
      const diagramId = `mermaid-id`;
      
      // Return HTML that uses external script for rendering
      const mermaidHtml = `
      <head>  
        <script src="src/mermaid-render.js"></script>  <!-- Adjust path as needed -->
      </head>
        <div class="mermaid-diagram" id="${diagramId}" data-diagram-id="${diagramId}" data-mermaid-code="${mermaidCode.replace(/"/g, '&quot;')}">
          <div class="mermaid-code">
            <pre><code>${mermaidCode}</code></pre>
          </div>
          <div class="mermaid-container">
            <div class="mermaid" id="${diagramId}-render">${mermaidCode}</div>
          </div>
        </div>
        <script>
          // Call the external render function
          console.log('Attempting to call renderMermaidDiagram...');
          console.log('renderMermaidDiagram type:', typeof renderMermaidDiagram);
          console.log('window.renderMermaidDiagram type:', typeof window.renderMermaidDiagram);
          
          if (typeof renderMermaidDiagram === 'function') {
            console.log('Calling renderMermaidDiagram directly');
            renderMermaidDiagram('${diagramId}', \`${mermaidCode}\`);
          } else if (typeof window.renderMermaidDiagram === 'function') {
            console.log('Calling window.renderMermaidDiagram');
            window.renderMermaidDiagram('${diagramId}', \`${mermaidCode}\`);
          } else {
            console.error('renderMermaidDiagram function not found');
            console.log('Available window properties:', Object.keys(window).filter(key => key.includes('render')));
          }
        </script>
      `;
      console.log('MermaidDiagramTool: Mermaid HTML created successfully');
      console.log('MermaidDiagramTool: Mermaid HTML:', mermaidHtml);
      return mermaidHtml;
      
    } catch (error) {
      console.error('MermaidDiagramTool error:', error);
      return `Error creating Mermaid diagram: ${error.message}`;
    }
  }
}

