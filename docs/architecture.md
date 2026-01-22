# Architecture

The Sanctuary application employs a modern, distributed architecture designed for scalability, real-time interactivity, and cross-platform compatibility. The system is composed of several key components that communicate to provide a seamless user experience.

## High-Level Diagram

```
+----------------+       +-------------------+       +--------------------+
|                |       |                   |       |                    |
|  Web Client    |<----->|  Convex Backend   |<----->|  Convex Database   |
| (apps/web)     |       | (packages/convex) |       |                    |
|                |       |                   |       |                    |
+----------------+       +-------------------+       +--------------------+
        ^                        ^
        |                        |
        |      HTTP/WebSocket    |
        |                        |
        v                        v
+----------------+       +-----------------------+
|                |       |                       |
| Electron Client|<----->| Cloudflare Worker     |
| (apps/electron)|       | (workers/bible-proxy) |
|                |       |                       |
+----------------+       +-----------------------+
```

## Component Breakdown

1.  **Frontend Applications (`apps/web` & `apps/electron`)**
    *   **Web Application (`apps/web`)**: A React-based single-page application (SPA) built with Vite. It interacts with the Convex backend for data persistence, real-time updates, and authentication. Styling is managed with Tailwind CSS.
    *   **Electron Application (`apps/electron`)**: A desktop wrapper around the web application, providing native desktop features and potentially offline capabilities or system integrations not available in the browser. It shares much of the web application's codebase.

2.  **Convex Backend (`packages/convex`)**
    *   This package contains all the backend logic, real-time database schema, and serverless functions (mutations and queries) powered by Convex.
    *   It handles data storage for users, organizations, presentations, songs, and Bible data.
    *   Manages authentication and authorization for users.
    *   Provides real-time synchronization of data across connected clients.

3.  **Convex Database**
    *   The persistent data store for the application, managed entirely by Convex. It's a document database optimized for real-time updates and reactive queries.

4.  **Cloudflare Worker (`workers/bible-proxy`)**
    *   An edge computing service deployed on Cloudflare's global network.
    *   Acts as a proxy, potentially to fetch Bible data from external APIs or provide cached responses, reducing latency and offloading traffic from the main Convex backend.

5.  **Shared Packages (`packages/shared` & `packages/ui`)**
    *   **`packages/shared`**: Contains common utilities, types, interfaces, and constants used across both frontend and backend components, ensuring consistency and reducing duplication.
    *   **`packages/ui`**: A library of reusable UI components (e.g., buttons, forms, modals) built with React and Tailwind CSS. This promotes a consistent look and feel across `apps/web` and `apps/electron` and accelerates UI development.

## Data Flow

*   Frontend applications initiate requests (queries, mutations) to the Convex Backend.
*   Convex Backend processes these requests, interacts with the Convex Database, and pushes real-time updates back to subscribed frontend clients.
*   The Cloudflare Worker may be invoked by frontend applications for specific data retrieval tasks, such as fetching Bible texts, which might then be processed by the frontend or passed to Convex for storage.
*   Shared types and utilities ensure that data structures are consistent across the entire stack.
