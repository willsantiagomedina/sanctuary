# Development Setup

This guide outlines the steps to set up your local development environment for the Sanctuary project.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: Version 18 or higher (LTS recommended).
*   **pnpm**: A fast, disk space efficient package manager.
    *   To install pnpm: `npm install -g pnpm`
*   **Git**: For version control.
*   **Convex CLI**: For interacting with the Convex backend.
    *   To install Convex CLI: `npm install -g convex-cli` (or `pnpm add -g convex-cli`)
*   **Cloudflare Wrangler CLI**: For developing and deploying Cloudflare Workers.
    *   To install Wrangler CLI: `npm install -g wrangler` (or `pnpm add -g wrangler`)

## Getting Started

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-org/sanctuary.git # Replace with actual repo URL
    cd sanctuary
    ```

2.  **Install Dependencies:**
    The project uses pnpm workspaces for dependency management.
    ```bash
    pnpm install
    ```

3.  **Convex Setup:**
    *   **Create a Convex Project:** If you don't have one, create a new Convex project via the Convex dashboard or CLI.
    *   **Link Local Project:** Link your local `packages/convex` to your Convex project.
        ```bash
        cd packages/convex
        npx convex init # Follow prompts to link to your project
        # This will create a .convex/config.json file
        cd ../..
        ```
    *   **Push Schema and Functions:**
        ```bash
        pnpm convex deploy --project <your-convex-project-slug>
        ```
        (Note: The actual deploy command might be `npx convex deploy` or defined in `package.json` scripts.)

4.  **Cloudflare Worker Setup:**
    *   **Login to Cloudflare:**
        ```bash
        wrangler login
        ```
    *   **Configure Worker:** Ensure `workers/bible-proxy/wrangler.toml` is configured correctly for your Cloudflare account.

5.  **Environment Variables:**
    *   Copy `.env.example` to `.env` in `apps/web/`.
    *   Populate necessary environment variables, such as Convex deployment URL, Cloudflare Worker URL, etc.
        ```bash
        cp apps/web/.env.example apps/web/.env
        # Edit apps/web/.env with your values
        ```

## Running Applications

### Web Application (`apps/web`)

```bash
cd apps/web
pnpm dev
```
The web application should now be running at `http://localhost:5173` (or similar).

### Electron Application (`apps/electron`)

```bash
cd apps/electron
pnpm dev
```
This will launch the Electron desktop application.

### Convex Backend

The Convex backend runs automatically in the cloud. During development, changes to `packages/convex` functions are automatically deployed by the Convex CLI if `convex dev` is running (or `pnpm convex deploy` manually).

```bash
cd packages/convex
pnpm convex dev # This command will watch for changes and deploy them
```

### Cloudflare Worker (`workers/bible-proxy`)

```bash
cd workers/bible-proxy
pnpm dev
```
This will start a local development server for your Cloudflare Worker.

## Common Development Scripts

Check the `package.json` files in each `app/` and `package/` for specific scripts like `build`, `test`, `lint`, etc.
