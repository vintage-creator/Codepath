import * as vscode from "vscode";
import { processWorkspace } from "./fileProcessor";
import { getWebviewContent } from "./utils";

export async function activate(context: vscode.ExtensionContext) {
  const symbolCache = new Map<string, vscode.DocumentSymbol[]>();

  // Create a status bar item
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100);
  
  // Verify Red Hat Java extension availability
  const redHatExtension = vscode.extensions.getExtension("redhat.java");
  if (!redHatExtension) {
    vscode.window.showErrorMessage(
      "Red Hat Java extension is required but not installed."
    );
    return;
  }

  try {
    if (!redHatExtension.isActive) {
      await redHatExtension.activate();
      if (!redHatExtension.isActive) {
        vscode.window.showErrorMessage(
          "Failed to activate Red Hat Java extension."
        );
        return;
      }
    }
  } catch (error) {
    vscode.window.showErrorMessage(
      `Error activating Red Hat Java extension: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return;
  }

  // Register commands
  context.subscriptions.push(
    // Command for visualization
    vscode.commands.registerCommand("codepath.scanWorkspace", async () => {
      const workspace = vscode.workspace.workspaceFolders?.[0];
      if (!workspace) {
        vscode.window.showErrorMessage("No workspace open");
        return;
      }

      // Set initial status message
      statusBarItem.text = '📂 Scanning workspace...';
      statusBarItem.show();


      // Inform the user that the workspace is being scanned
      vscode.window.showInformationMessage('📂 Scanning workspace, please wait...');

      
      const panel = vscode.window.createWebviewPanel(
        "codeVisualizer",
        "Code Visualization",
        vscode.ViewColumn.One,
        { enableScripts: true }
      );

      try {
        const { nodes, edges } = await processWorkspace(
          workspace.uri.fsPath,
          symbolCache
        );

        // Add cache validation
        const existingNodes = new Set<string>();
        const validatedNodes = nodes.filter((n) => {
          if (existingNodes.has(n.id)) {
            console.warn(`Duplicate node skipped: ${n.id}`);
            return false;
          }
          existingNodes.add(n.id);
          return true;
        });

        // Update status bar with success message
        statusBarItem.text = '✅ Codebase scan complete! Generating visualization...';

        // Inform the user that the scan is complete and the visualization is being generated
        vscode.window.showInformationMessage('✅ Codebase scan complete! Generating visualization...');

        // Update webview content
        panel.webview.html = getWebviewContent(validatedNodes, edges);

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(async (message) => {
          if (message.type === "nodeClick" && message.nodeType === "file") {
            const uri = vscode.Uri.file(message.path);
            const doc = await vscode.workspace.openTextDocument(uri);
            vscode.window.showTextDocument(doc);
          }
          if (message.type === "export") {
            const uri = await vscode.window.showSaveDialog({
              filters: { "JSON Files": ["json"] },
            });

            if (uri) {
              await vscode.workspace.fs.writeFile(
                uri,
                Buffer.from(message.data)
              );
              vscode.window.showInformationMessage(
                "Visualization state exported successfully!"
              );
            }
          }
        });
      } catch (error) {
        // Update status bar with error message
        statusBarItem.text = `❌ Error in scanning codebase`;

        vscode.window.showErrorMessage(
          `Processing failed: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    }),

    // Separate command for full structure export
    vscode.commands.registerCommand(
      "codepath.exportFullStructure",
      async () => {
        const workspace = vscode.workspace.workspaceFolders?.[0];
        if (!workspace) {
          vscode.window.showErrorMessage("No workspace open");
          return;
        }

        const uri = await vscode.window.showSaveDialog({
          filters: { "JSON Files": ["json"] },
          defaultUri: vscode.Uri.joinPath(workspace.uri, "code-structure.json"),
        });

        if (uri) {
          try {
            const { nodes, edges } = await processWorkspace(
              workspace.uri.fsPath,
              new Map() 
            );

            const exportData = {
              metadata: {
                generatedAt: new Date().toISOString(),
                projectRoot: workspace.uri.fsPath,
                totalNodes: nodes.length,
                totalEdges: edges.length,
              },
              nodes,
              edges,
            };

            await vscode.workspace.fs.writeFile(
              uri,
              Buffer.from(JSON.stringify(exportData, null, 2))
            );

            vscode.window.showInformationMessage(
              "Full code structure exported successfully!"
            );
          } catch (error) {
            vscode.window.showErrorMessage(
              `Export failed: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
            console.error("Full error stack:", error);
          }
        }
      }
    )
  );
}
