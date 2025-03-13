import * as vscode from "vscode";
import { readdir } from "fs/promises";
import * as path from "path";
import { CodeElement, VisualizationEdge, MAX_CONCURRENT_FILES, MAX_DEPTH } from "./types";
import { processJavaFile } from "./symbolProcessor";

export async function processWorkspace(
  rootPath: string,
  symbolCache: Map<string, vscode.DocumentSymbol[]>
) {
  const nodes: CodeElement[] = [];
  const edges: VisualizationEdge[] = [];
  const methodMap = new Map<string, CodeElement>();

  await processDirectory(rootPath, nodes, edges, methodMap, symbolCache);
  return { nodes, edges };
}

async function processDirectory(
  dirPath: string,
  nodes: CodeElement[],
  edges: VisualizationEdge[],
  methodMap: Map<string, CodeElement>,
  symbolCache: Map<string, vscode.DocumentSymbol[]>,
  depth = 0
) {
  if (depth > MAX_DEPTH) {
    console.warn(`Reached maximum depth at ${dirPath}`);
    return;
  }

  const dirNode: CodeElement = {
    id: `dir:${dirPath}`,
    label: path.basename(dirPath),
    type: "directory",
    group: "directory",
    path: dirPath,
  };
  nodes.push(dirNode);

  const entries = await readdir(dirPath, { withFileTypes: true });
  const processQueue: Promise<void>[] = [];

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      processQueue.push(
        processDirectory(
          fullPath,
          nodes,
          edges,
          methodMap,
          symbolCache,
          depth + 1
        )
      );
    } else if (entry.isFile() && fullPath.endsWith(".java")) {
      processQueue.push(
        processJavaFile(
          fullPath,
          dirNode.id,
          nodes,
          edges,
          methodMap,
          symbolCache
        )
      );
    }

    if (processQueue.length >= MAX_CONCURRENT_FILES) {
      await Promise.all(processQueue);
      processQueue.length = 0;
    }
  }
  await Promise.all(processQueue);
}