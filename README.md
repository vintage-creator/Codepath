# Codepath README

## Introduction

**Codepath** is a Visual Studio Code extension designed to help developers visualize and explore codebases more effectively. It provides an interactive graph structure for better understanding relationships between files, directories, and functions.

## Features

- 📂 **Codebase Visualization** – View your codebase as an interactive tree/graph.
- 🖥️ **Supports Multiple Languages** – Currently supports **Java**, with upcoming support for JavaScript, Python, Go, C#, PHP, and more.  
- 🔍 **Interactive Navigation** – Clickable nodes to explore relationships between files and functions.
- 📜 **Scroll and Collapse Support** – Easily navigate through large projects with collapsible nodes and scrollable views.

## Installation

### Prerequisites
- [Visual Studio Code](https://code.visualstudio.com/) (Latest stable version recommended)
- [Node.js](https://nodejs.org/) (v14 or later recommended)
- Either [Yarn](https://yarnpkg.com/) or [pnpm](https://pnpm.io/) installed globally

#### Install pnpm (if not already installed)
```bash
npm install -g pnpm
```

#### Install Yarn (if not already installed)
```bash
npm install -g yarn
```

### Installing Codepath
Clone the repository and install dependencies:
```bash
git clone https://github.com/vintage-creator/Codepath.git
cd codepath
yarn install  # or use pnpm install
```

Build and run the extension in VS Code:
```bash
yarn build  # or pnpm build
code .  # Open in VS Code
```

Press `F5` in VS Code to launch an instance with Codepath enabled.

## Usage

### Scanning a Workspace
1. Open a project in VS Code.
2. Run the command `Visualize Code Structure` from the command palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
3. Wait for the scan to complete, and the visualization will open automatically.

### Interacting with the Visualization
- Click on a **directory** to expand or collapse it.
- Click on a **file** to see its contents.
- Hover over a **function or class** to see more details.

## Contribution Guidelines

We welcome contributions from the community! Follow these steps to contribute:

1. **Fork the repository** on GitHub.
2. **Create a new branch** for your feature or bug fix:
   ```bash
   git checkout -b feature-new-idea
   ```
3. **Make changes** and commit them with a clear message:
   ```bash
   git commit -m "Added new feature X"
   ```
4. **Push your changes** to GitHub:
   ```bash
   git push origin feature-new-idea
   ```
5. **Open a pull request** with a detailed description.

## Reporting Issues

If you encounter bugs or have feature requests, please open an issue on GitHub:
[GitHub Issues](https://github.com/vintage-creator/Codepath/issues)

## License

This project is licensed under the [MIT License](LICENSE).

---

📢 **Stay Connected**  
Follow updates and discussions on [GitHub](https://github.com/vintage-creator/Codepath)!

