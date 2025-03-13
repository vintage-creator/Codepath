import * as path from "path";
import { CodeElement, VisualizationEdge } from "./types";


const NODE_COLORS = {
    directory: "#4A90E2",
    file: "#50E3C2",
    package: "#F5A623",
    class: "#BD10E0",
    method: "#7ED321",
  };

export function createPackageNode(
  fileNode: CodeElement,
  packageName: string
): CodeElement {
  return {
    id: `package:${packageName}`,
    label: packageName,
    type: "package",
    path: path.join(fileNode.path, packageName),
    parentId: fileNode.id,
    group: "package",
  };
}

export function getWebviewContent(
  nodes: CodeElement[],
  edges: VisualizationEdge[]
): string {
  const safeNodes = JSON.stringify(nodes).replace(/</g, "\\u003c");
  const safeEdges = JSON.stringify(edges).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Codebase Visualization</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis-network.min.css" rel="stylesheet"/>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis-network.min.js"></script>
     <style>
            body {
                margin: 0;
                padding: 0;
                color: #ffffff; 
                background-color: #1e1e1e;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
            }
            #container {
                display: grid;
                grid-template-rows: auto 1fr;
                height: 100vh;
            }
            #graph-container {
                display: flex;
                flex-grow: 1;
                overflow: hidden;
            }
            .header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 1rem;
                position: relative;
                background-color: #333333; 
            }
            .header .theme-toggle-btn {
                position: absolute;
                right: 140px;
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
            }
            #export-btn {
                background-color: #4A90E2;
                color: white;
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 4px;
                height: 2.2rem;
                cursor: pointer;
            }
            .search-box {
                width: 300px;
                padding: 0.5rem 1rem;
                border: 1px solid #ced4da;
                border-radius: 4px;
                margin-bottom: 1rem;
            }
            #network {
                width: 100%;
                height: 100%;
            }
            .legend {
                position: fixed;
                color: black;
                bottom: 20px;
                right: 20px;
                background: rgba(255,255,255,0.9);
                padding: 1rem;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            .legend-item {
                display: flex;
                align-items: center;
                margin: 0.5rem 0;
            }
            .legend-color {
                width: 20px;
                height: 20px;
                border-radius: 4px;
                margin-right: 0.5rem;
            }
            .canvas-interaction {
                color: #FFFFF;
                margin-left: 20px;
            }
            
            .canvas-interaction .interaction-list {
                padding-left: 0;
                margin-left: 0;
                list-style-position: inside;
            }
        </style>
</head>
<body>
    <div id="container">
            <div class="header">
                <input type="text" class="search-box" placeholder="🔍 Search files, classes, methods..." id="search"/>
                <button id="export-btn" class="export-button">Export JSON</button>
                 <!-- Icon button for toggling theme -->
               <button id="theme-toggle-btn" class="theme-toggle-btn">🌙</button>
            </div>
            <div id="graph-container">
                <div id="network"></div>
            </div>

            <div class="legend">
                <h3>Visualization Guide</h3>
                <div class="legend-item">
                    <div class="legend-color" style="background: ${NODE_COLORS.directory}"></div>
                    <span>Directory</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: ${NODE_COLORS.file}"></div>
                    <span>Java File</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: ${NODE_COLORS.package}"></div>
                    <span>Package</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: ${NODE_COLORS.class}"></div>
                    <span>Class</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: ${NODE_COLORS.method}"></div>
                    <span>Method</span>
                </div>
                <h4 style="margin-top: 1rem;">Relationships:</h4>
                <div class="legend-item">
                    <div class="legend-color" style="background: #4CAF50"></div>
                    <span>Method call within same class</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #2196F3"></div>
                    <span>Method call within same package</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color" style="background: #FF5252"></div>
                    <span>Cross-package method call</span>
                </div>
            </div>
             <!-- Canvas Interaction Guide Below the Graph -->
            <div class="canvas-interaction">
                <h4>Canvas Interaction:</h4>
                <ul class="interaction-list">
                    <li>Use one finger to drag the canvas and move the graph.</li>
                    <li>Use two fingers to pinch—spread them to zoom in or bring them together to zoom out.</li>
                    <li>To get the full canvas view, close the terminal.</li>
                </ul>
            </div>

    
    <script>
        (function() {
            const vscode = acquireVsCodeApi();
            const container = document.getElementById('network');

            // Define node groups with colors
            const NODE_GROUPS = {
                directory: {
                    color: '#4A90E2',
                    font: { color: '#ffffff' }
                },
                file: {
                    color: '#50E3C2',
                    font: { color: '#2c3e50' }
                },
                package: {
                    color: '#F5A623',
                    font: { color: '#ffffff' }
                },
                class: {
                    color: '#BD10E0',
                    font: { color: '#ffffff' }
                },
                method: {
                    color: '#7ED321',
                    font: { color: '#2c3e50' }
                }
            };

            // Initialize datasets
            const nodes = new vis.DataSet(${safeNodes}.map(node => ({
                ...node,
                group: node.type 
            })));

            const edges = new vis.DataSet(${safeEdges});
            const data = { nodes, edges };

            // Fixed options
            const options = {
                layout: {
                    hierarchical: {
                        enabled: true,
                        levelSeparation: 150,
                        nodeSpacing: 100,
                        treeSpacing: 200,
                        blockShifting: true,
                        edgeMinimization: true,
                        parentCentralization: true,
                        direction: "UD",
                        sortMethod: "directed"
                    }
                },
                physics: {
                    stabilization: {
                        enabled: true,
                    }
                },
                interaction: {
                    zoomView: true, 
                    dragView: true   
                },
                nodes: {
                    shape: 'box',
                    margin: 25,
                    fixed: { x: true, y: true },
                    font: {
                        size: 16,
                        face: 'Roboto',
                        bold: "20px Arial #000",
                        color: '#2c3e50'
                    },
                    widthConstraint: {
                        minimum: 200,
                        maximum: 300
                    }
                },
                edges: {
                    arrows: 'to',
                    width: 2,
                    color: '#888888',
                    smooth: false
                },
                groups: NODE_GROUPS
            };

            // Initialize network
            const network = new vis.Network(container, data, options);

            network.on("stabilizationIterationsDone", () => {
                network.setOptions({ physics: false });
            });

            let isDarkMode = true; 

            function toggleTheme() {
                isDarkMode = !isDarkMode;
                const body = document.body;

                // Toggle theme based on isDarkMode
                if (isDarkMode) {
                body.style.backgroundColor = '#1e1e1e'; 
                body.style.color = '#ffffff'; 
                } else {
                body.style.backgroundColor = '#ffffff'; 
                body.style.color = '#000000'; 
                }

                document.getElementById("theme-toggle-btn").innerHTML = isDarkMode ? "🌙" : "🌞";
            }
            // Attach event listener after DOM is loaded
            document.getElementById("theme-toggle-btn").addEventListener("click", toggleTheme);

            // Search functionality
            document.getElementById('search').addEventListener('input', function(e) {
                const query = e.target.value.toLowerCase();
                nodes.forEach(node => {
                    const match = [
                        node.label,
                        node.type,
                        node.metadata?.package,
                        node.metadata?.className,
                        node.path
                    ].join(' ').toLowerCase().includes(query);

                    nodes.update({
                        id: node.id,
                        hidden: !match
                    });
                });
            });

            // Click handling
            network.on('click', params => {
                if (params.nodes.length) {
                    const node = nodes.get(params.nodes[0]);
                    if (node?.type === 'file') {
                        vscode.postMessage({
                            type: 'openFile',
                            path: node.path
                        });
                    }
                }
            });

            network.on("doubleClick", (params) => {
                if (params.nodes.length) {
                    const node = nodes.get(params.nodes[0]);
                    const children = nodes.get({
                        filter: child => child.parentId === node.id
                    });

                    nodes.update({
                        id: node.id,
                        expanded: !node.expanded
                    });

                    children.forEach(child => {
                        nodes.update({
                            id: child.id,
                            hidden: !node.expanded
                        });
                    });
                }
            });

            // Export button
            document.getElementById('export-btn').addEventListener('click', () => {
                const visibleNodes = nodes.get({ filter: node => !node.hidden });
                const visibleEdges = edges.get();

                vscode.postMessage({
                    type: 'export',
                    data: JSON.stringify({
                        nodes: visibleNodes,
                        edges: visibleEdges
                    }, null, 2)
                });
            });

        })();
    </script>
</body>
</html>`;
}
