import * as vscode from "vscode";
import * as path from "path";
import { CodeElement, VisualizationEdge } from "./types";
import { processMethodCalls } from "./methodCallDetector";
import { createPackageNode, createClassNode, createMethodNode } from "./nodeFactory";


export async function processJavaFile(
  filePath: string,
  parentId: string,
  nodes: CodeElement[],
  edges: VisualizationEdge[],
  methodMap: Map<string, CodeElement>,
  symbolCache: Map<string, vscode.DocumentSymbol[]>
) {
  // Compute file node id first
  const fileId = `file:${filePath}`;
  if (nodes.some((n) => n.id === fileId)) {
    console.log(`Skipping duplicate file: ${filePath}`);
    return;
  }
  const fileNode: CodeElement = {
    id: fileId,
    label: path.basename(filePath),
    type: "file",
    path: filePath,
    parentId,
    group: "file"
  };
  nodes.push(fileNode);

  try {
    const uri = vscode.Uri.file(filePath);
    const document = await vscode.workspace.openTextDocument(uri);
    const symbols = await getDocumentSymbols(document, symbolCache);

    if (!symbols) return;

    const text = document.getText();
    await processSymbols(
      symbols,
      text,
      filePath,
      fileNode.id,
      nodes,
      edges,
      methodMap
    );
    console.log(`Processing file: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Function to get document symbols (caching results for efficiency)
export async function getDocumentSymbols(
  document: vscode.TextDocument,
  symbolCache: Map<string, vscode.DocumentSymbol[]>
): Promise<vscode.DocumentSymbol[] | undefined> {
  const uri = document.uri.toString();

  if (!symbolCache.has(uri)) {
    const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
      "vscode.executeDocumentSymbolProvider", 
      document.uri
    );
    if (symbols) symbolCache.set(uri, symbols);
  }

  return symbolCache.get(uri);
}

// Function to process symbols (classes, methods, and packages)
export async function processSymbols(
  symbols: vscode.DocumentSymbol[],
  text: string,
  filePath: string,
  parentId: string,
  nodes: CodeElement[],
  edges: VisualizationEdge[],
  methodMap: Map<string, CodeElement>,
  currentPackage = "default",
  currentClass = "AnonymousClass"
) {
  const existingIds = new Set(nodes.map((n) => n.id));
  const filename = path.basename(parentId);

  for (const symbol of symbols) {
    switch (symbol.kind) {
      case vscode.SymbolKind.Package: {
        currentPackage = symbol.name;
        nodes.push(createPackageNode(currentPackage, parentId));
        break;
      }
      case vscode.SymbolKind.Class: {
        currentClass = symbol.name;
        const classNode = createClassNode(
          currentPackage,
          currentClass,
          parentId,
          filePath
        );
        if (!existingIds.has(classNode.id)) {
          nodes.push(classNode);
          edges.push({
            from: parentId, 
            to: classNode.id,
            arrows: "to",
            color: "#FF9800",
            width: 2,
            title: `${filename} contains ${classNode.id}`
          });
          existingIds.add(classNode.id);
        }
        break;
      }
      case vscode.SymbolKind.Method: {
        const methodNode = createMethodNode(
          symbol,
          currentPackage,
          currentClass,
          filePath,
          parentId
        );
        nodes.push(methodNode);
        methodMap.set(methodNode.id, methodNode);
        edges.push({
          from: parentId, 
          to: methodNode.id,
          arrows: "to",
          color: "#FF9800",
          width: 2,
          title: `${filename} has ${methodNode.id}`
        });
        await processMethodCalls(
          symbol,
          text,
          filePath,
          methodNode,
          edges,
          methodMap
        );
        break;
      }
    }
  }
}

