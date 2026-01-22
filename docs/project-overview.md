# Project Overview: Sanctuary

Sanctuary is a modern application designed to facilitate **worship presentation, Bible study, and content management for churches or religious organizations**. It leverages a robust monorepo architecture to manage multiple interdependent applications and packages efficiently.

## Core Technologies

*   **Frontend**: React (with Vite) for the web application, Electron for the desktop client.
*   **Backend**: Convex for real-time database, serverless functions, and authentication.
*   **Monorepo Management**: pnpm workspaces.
*   **Styling**: Tailwind CSS.
*   **Cloudflare Workers**: For edge computing services (e.g., API proxies).
*   **TypeScript**: Used across the entire codebase for type safety and improved developer experience.

## Monorepo Structure

The project is organized as a pnpm monorepo, which helps in managing dependencies and sharing code across different parts of the application. Key directories include:

*   **`apps/`**: Contains the primary applications (web, electron).
*   **`packages/`**: Houses shared libraries, UI components, and Convex backend code.
*   **`workers/`**: Contains Cloudflare Worker projects.

This structure promotes code reusability, simplifies dependency management, and ensures consistency across the different platforms.
