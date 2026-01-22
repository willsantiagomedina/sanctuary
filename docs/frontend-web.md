# Frontend: Web Application (`apps/web`)

The web application is the primary user interface for Sanctuary, built using React and Vite. It provides a rich, interactive experience for managing presentations, exploring the Bible, and more.

## Technologies Used

*   **Framework**: React
*   **Build Tool**: Vite
*   **Language**: TypeScript
*   **Styling**: Tailwind CSS, PostCSS
*   **State Management**: Potentially React Context, or other libraries based on usage in `contexts/` and `stores/`.
*   **Backend Interaction**: Convex client for real-time data and functions.

## Directory Structure

*   **`public/`**: Static assets like `index.html`, favicons, images, and special Cloudflare Pages configuration files (`_headers`, `_redirects`).
*   **`src/`**: Contains the main source code for the React application.
    *   **`App.tsx`**: The root component of the React application, often containing routing and global layout.
    *   **`main.tsx`**: The entry point for the React application, rendering `App.tsx` into the DOM.
    *   **`vite-env.d.ts`**: Vite-specific TypeScript declarations.
    *   **`components/`**: Reusable UI components specific to the web application.
        *   `bible/`: Components related to Bible display and interaction.
        *   `editor/`: Components for editing presentations, songs, etc.
        *   `layout/`: Structural components like headers, footers, navigation.
        *   `live/`: Components for live presentation view.
        *   `slides/`: Components specifically for slide management or display.
    *   **`contexts/`**: React Context API providers for global state management, e.g., `AuthContext.tsx`.
    *   **`data/`**: Local data definitions or pre-loaded data, such as `bible.ts`, `kjv-complete.ts`, `songs.ts`. These might be used for initial seeding or static content.
    *   **`hooks/`**: Custom React hooks for encapsulating reusable logic, e.g., `useBible.ts`, `useKeyboardShortcuts.ts`, `usePresentation.ts`.
    *   **`lib/`**: Utility functions and client-side libraries.
        *   `auth/`: Client-side authentication logic.
        *   `bible-cache.ts`: Logic for caching Bible data.
        *   `bible-seed.ts`: Logic for seeding Bible data into the client or Convex.
    *   **`pages/`**: Top-level components that represent different routes or views of the application.
        *   `Auth.tsx`: Authentication-related pages (login, signup).
        *   `BibleExplorer.tsx`: Interface for browsing and searching the Bible.
        *   `Dashboard.tsx`: Main user dashboard.
        *   `LivePresenter.tsx`: Page for presenting content live.
        *   `PresentationEditor.tsx`: Editor for creating and modifying presentations.
        *   `Settings.tsx`: User settings page.
        *   `SongLibrary.tsx`: Library for managing songs.
    *   **`stores/`**: Possibly Zustand, Redux, or similar store implementations for application-wide state.
        *   `app.ts`: Global application state.
        *   `editor.ts`: State specific to editor functionalities.
    *   **`styles/`**: Global CSS files, primarily `globals.css` which likely imports Tailwind CSS.
    *   **`types/`**: TypeScript type definitions specific to the web application, e.g., `electron.d.ts` for Electron bridge types when running within the Electron app.

## Key Features (Inferred)

*   User Authentication and Authorization.
*   Dashboard for an overview.
*   Bible browsing and search.
*   Creation and editing of presentations.
*   Management of song libraries.
*   Live presentation capabilities.
*   Application settings.

## Configuration

*   **`vite.config.ts`**: Vite build configuration.
*   **`tailwind.config.js`**: Tailwind CSS configuration.
*   **`postcss.config.js`**: PostCSS configuration.
*   **`tsconfig.json`**: TypeScript configuration for the web app.
*   **`wrangler.toml`**: Cloudflare Pages/Workers configuration for the web app's deployment (if used for static hosting).
