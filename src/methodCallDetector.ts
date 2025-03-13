import * as vscode from "vscode";
import * as path from "path";
import { CodeElement, VisualizationEdge } from "./types";  
import { getEdgeColor, getSymbolContext, decodeSemanticTokens } from "./codeAnalyzer";

// Function to detect method calls in a given method
async function detectMethodCalls(
    methodSymbol: vscode.DocumentSymbol,
    text: string,
    filePath: string
  ): Promise<Array<{ pkg: string; className: string; methodName: string }>> {
    const calls: Array<{ pkg: string; className: string; methodName: string }> =
      [];
    const uri = vscode.Uri.file(filePath);
  
    try {
      // Get the method body text using its range
      const methodText = text.substring(
        methodSymbol.range.start.character,
        methodSymbol.range.end.character
      );
  
      // Get the symbols in the document
      const symbols: vscode.DocumentSymbol[] =
        await vscode.commands.executeCommand(
          "vscode.executeDocumentSymbolProvider",
          uri
        );
  
      const definitions = await vscode.commands.executeCommand<vscode.Location[]>(
        "vscode.executeDefinitionProvider",
        uri,
        methodSymbol.range.start
      );
  
      if (definitions?.[0]) {
        const targetUri = definitions[0].uri.fsPath;
        const targetHash = path.basename(targetUri, ".java").replace(/\./g, "_");
        console.log("Target Hash", targetHash);
      }
  
      const methodCallRegex = /(\b\w+\b)\s*\(/g;
      let match;
  
      while ((match = methodCallRegex.exec(methodText)) !== null) {
        if (match[1]) {
          // Ensure match[1] is defined
          const methodName = match[1];
          const context = getSymbolContext(symbols, methodSymbol);
          // Skip constructor calls and this.method references
          if (!["this", "super"].includes(methodName)) {
            calls.push({
              pkg: context.package || "default",
              className: context.className || "Unknown",
              methodName,
            });
          }
        }
      }
  
      // Get semantic tokens for precise detection
      const semanticTokens =
        await vscode.commands.executeCommand<vscode.SemanticTokens>(
          "vscode.provideDocumentSemanticTokens",
          uri
        );
  
      if (semanticTokens) {
        const legend =
          await vscode.commands.executeCommand<vscode.SemanticTokensLegend>(
            "vscode.provideDocumentSemanticTokensLegend",
            uri
          );
        const tokens = decodeSemanticTokens(semanticTokens, legend);
  
        tokens.forEach((token) => {
          if (
            token.type === "method" &&
            methodSymbol.range.contains(token.range.start)
          ) {
            const methodName = text.substring(
              token.range.start.character,
              token.range.end.character
            );
            calls.push({
              pkg: "default",
              className: "Unknown",
              methodName,
            });
          }
        });
      }
    } catch (error) {
      console.error("Method call detection error:", error);
    }
    return calls;
  }


// Function to process method calls and create edges
export async function processMethodCalls(
  methodSymbol: vscode.DocumentSymbol,
  text: string,
  filePath: string,
  methodNode: CodeElement,
  edges: VisualizationEdge[],
  methodMap: Map<string, CodeElement>
) {
  const calls = await detectMethodCalls(methodSymbol, text, filePath);

  for (const call of calls) {
    const targetId = `meth:${call.pkg}.${call.className}.${call.methodName}`;
    const targetMethod = methodMap.get(targetId);

    if (targetMethod) {
      edges.push({
        from: methodNode.id,
        to: targetId,
        arrows: "to",
        color: getEdgeColor(methodNode, targetMethod),  // Assuming you have an edge color function
        width: 2
      });
    } else {
      console.warn(`Target method not found: ${targetId}`);
    }
  }
}
