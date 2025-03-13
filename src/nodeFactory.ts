import * as vscode from "vscode";
import * as path from "path";
import { CodeElement } from "./types";  

export function createPackageNode(pkg: string, parentId: string): CodeElement {
    return {
      id: `pkg:${pkg}`,
      label: pkg,
      type: "package",
      path: pkg,
      parentId,
      group: "package",
      metadata: { package: pkg },
    };
  }
  
  export function createClassNode(
    pkg: string,
    className: string,
    parentId: string,
    filePath: string
  ): CodeElement {
    // Generate unique ID using package, class name and file path hash
    const uniqueId = path.basename(filePath, '.java').replace(/\./g, '_');
    return {
      id: `cls:${pkg}.${className}_${uniqueId}`,
      label: className,
      type: "class",
      path: `${pkg}.${className}`,
      parentId,
      group: "class",
      metadata: { package: pkg, className },
    };
  }
  
  export function createMethodNode(
    symbol: vscode.DocumentSymbol,
    pkg: string,
    className: string,
    filePath: string,
    parentId: string
  ): CodeElement {
    return {
      id: `meth:${pkg}.${className}.${symbol.name}`,
      label: symbol.name,
      type: "method",
      path: filePath,
      parentId,
      group: "method",
      metadata: {
        parameters: symbol.detail?.split(","),
        package: pkg,
        className,
      },
    };
  }
  