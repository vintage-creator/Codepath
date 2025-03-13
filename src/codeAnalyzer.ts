import * as vscode from 'vscode';
import { CodeElement } from "./types";

// Utility function to get the color for edges based on the relationship of nodes
function getEdgeColor(source: CodeElement, target: CodeElement) {
  if (source.metadata?.className === target.metadata?.className)
    return "#4CAF50";
  if (source.metadata?.package === target.metadata?.package) return "#2196F3";
  return "#FF5252";
}

// Function to decode semantic tokens for method detection
function decodeSemanticTokens(
  tokens: vscode.SemanticTokens,
  legend: vscode.SemanticTokensLegend
) {
  const result = [];
  const data = tokens.data;
  let prevLine = 0;

  for (let i = 0; i < data.length; i += 5) {
    const line = prevLine + data[i];
    const char = data[i + 1];
    const length = data[i + 2];
    const typeIdx = data[i + 3];

    result.push({
      type: legend.tokenTypes[typeIdx],
      range: new vscode.Range(
        new vscode.Position(line, char),
        new vscode.Position(line, char + length)
      ),
    });
    prevLine = line;
  }
  return result;
}

//Function to determine the package and class context for a symbol
function getSymbolContext(
  symbols: vscode.DocumentSymbol[],
  target: vscode.DocumentSymbol
) {
  let pkg = "default";
  let cls = "AnonymousClass";

  function walk(symbols: vscode.DocumentSymbol[]) {
    for (const symbol of symbols) {
      if (symbol.range.contains(target.range)) {
        if (symbol.kind === vscode.SymbolKind.Package) pkg = symbol.name;
        if (symbol.kind === vscode.SymbolKind.Class) cls = symbol.name;
        if (symbol.children) walk(symbol.children);
      }
    }
  }

  walk(symbols);
  return { package: pkg, className: cls };
}

export { getEdgeColor, decodeSemanticTokens, getSymbolContext  };
