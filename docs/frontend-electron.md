# Frontend: Electron Application (`apps/electron`)

The Electron application provides a desktop experience for Sanctuary users, wrapping the web application within a native shell. This allows for system-level integrations and functionalities not available in a standard web browser.

<h2>Technologies Used</h2>

*   **Framework**: Electron
*   **Build Tool**: Electron Vite, Electron Builder
*   **Language**: TypeScript
*   **Renderer**: The web application (`apps/web`) serves as the renderer process.

<h2>Directory Structure</h2>

*   **`electron-builder.json`**: Configuration for `electron-builder`, used to package and distribute the Electron application for various operating systems.
*   **`electron.vite.config.ts`**: Configuration for `electron-vite`, handling the build process for the main and preload scripts, and integrating the web renderer.
*   **`package.json`**: Electron application-specific dependencies and scripts.
*   **`src/`**: Contains the Electron-specific source code.
    *   **`main.ts`**: The main process script of the Electron application. This script runs in a Node.js environment and handles native desktop features, window management, and communication with the renderer process.
    *   **`preload.ts`**: A script that runs before the renderer process (the web page) loads. It's used to expose Node.js APIs to the renderer process in a secure way, enabling communication between the renderer and main processes without directly exposing Node.js to the web content.
    *   **`renderer/index.html`**: This is likely a placeholder or minimal HTML file that loads the compiled web application from `apps/web` as its content. The web application itself is served by Vite and integrated here.

<h2>How it Works</h2>

The Electron application effectively embeds the `apps/web` React application.

1.  **Main Process (`main.ts`)**: Initializes the Electron window, sets up inter-process communication (IPC) channels, and handles native desktop events.
2.  **Preload Script (`preload.ts`)**: Acts as a bridge, exposing specific functionalities or APIs from the main process to the web (renderer) content securely, adhering to Electron's security best practices. For instance, `apps/web/src/types/electron.d.ts` likely defines the types for these exposed APIs.
3.  **Renderer Process**: The `apps/web` application runs within the Electron window. It can communicate with the main process via the APIs exposed by the preload script for native features (e.g., file system access, native notifications, custom menus).

<h2>Key Features (Potential)</h2>

*   **Offline Support**: Caching capabilities for working without an internet connection.
*   **Native Menus and Dialogs**: Custom application menus, context menus, and native file dialogs.
*   **System Notifications**: Sending desktop notifications.
*   **Deep Integration**: Access to Node.js modules and system APIs (via the main process and preload script).
*   **Automatic Updates**: Streamlined application updates.

<h2>Build and Packaging</h2>

`electron-builder` is used to create distributable packages (e.g., `.dmg` for macOS, `.exe` for Windows, `.deb`/`.rpm` for Linux) from the Electron project. The configuration in `electron-builder.json` dictates icon paths, output formats, and other build-related settings.
