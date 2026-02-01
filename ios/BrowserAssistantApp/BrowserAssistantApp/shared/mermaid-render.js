function renderMermaidDiagram(diagramId, mermaidCode) {
    if (typeof mermaid === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js';
      script.onload = function() {
        mermaid.initialize({
          startOnLoad: false,
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
        // Render the specific diagram
        mermaid.render(`${diagramId}-svg`, mermaidCode).then(({svg}) => {
          const container = document.getElementById(`${diagramId}-render`);
          if (container) {
            container.innerHTML = svg;
          }
        }).catch(err => {
          console.error('Mermaid rendering error:', err);
          const container = document.getElementById(`${diagramId}-render`);
          if (container) {
            container.innerHTML = '<div class="mermaid-error">Error rendering diagram: ' + err.message + '</div>';
          }
        });
      };
      document.head.appendChild(script);
    } else {
      // Mermaid is already loaded, render immediately
      mermaid.render(`${diagramId}-svg`, mermaidCode).then(({svg}) => {
        const container = document.getElementById(`${diagramId}-render`);
        if (container) {
          container.innerHTML = svg;
        }
      }).catch(err => {
        console.error('Mermaid rendering error:', err);
        const container = document.getElementById(`${diagramId}-render`);
        if (container) {
          container.innerHTML = '<div class="mermaid-error">Error rendering diagram: ' + err.message + '</div>';
        }
      });
    }
  }
  
  // Export the function if using modules (optional)
//   export { renderMermaidDiagram };