
export interface CodeElement {
  id: string;
  label: string;
  type: "directory" | "file" | "package" | "class" | "method";
  path: string;
  group: string;
  parentId?: string;
  metadata?: {
    parameters?: string[];
    references?: ReferenceLocation[];
    package?: string;
    className?: string;
  };
}

export interface ReferenceLocation {
  filePath: string;
  lineNumber: number;
  context: string;
}

export interface VisualizationEdge {
  from: string;
  to: string;
  arrows: "to";
  color: string;
  width: number;
  title?: string;
}

export const NODE_COLORS = {
  directory: "#4A90E2",
  file: "#50E3C2",
  package: "#F5A623",
  class: "#BD10E0",
  method: "#7ED321",
};

export const MAX_CONCURRENT_FILES = 100;
export const MAX_DEPTH = 20;