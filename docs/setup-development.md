# Development Setup

This guide outlines the steps to set up your local development environment for the Sanctuary project.

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Node.js**: Version 20 or higher (LTS recommended).
*   **Bun**: Runtime + workspace package manager powering this repo.
    *   To install Bun: `curl -fsSL https://bun.sh/install | bash`
*   **Git**: For version control.
*   **Convex CLI**: For interacting with the Convex backend.
    *   To install Convex CLI globally (optional): `npm install -g convex-cli` (or `bunx convex`)
*   **Cloudflare Wrangler CLI**: For developing and deploying Cloudflare Workers.
    *   To install Wrangler CLI globally (optional): `npm install -g wrangler` (or `bunx wrangler`)

## Getting Started

1.  **Clone the Repository:**
    ```bash
    git clone https://github.com/your-org/sanctuary.git # Replace with actual repo URL
    cd sanctuary
    ```

2.  **Install Dependencies:**
    The project uses Bun workspaces configured in the root `package.json`.
    ```bash
    bun install
    ```

3.  **Convex Setup:**
    *   **Create a Convex Project:** If you don't have one, create a new Convex project via the Convex dashboard or CLI.
    *   **Link Local Project:** Link your local `packages/convex` to your Convex project.
        ```bash
        cd packages/convex
        bunx convex init # Follow prompts to link to your project
        # This will create a .convex/config.json file
        cd ../..
        ```
    *   **Push Schema and Functions:**
        ```bash
        bun --cwd packages/convex run deploy --project <your-convex-project-slug>
        ```
        (This wraps the `convex deploy` script defined in `packages/convex/package.json`.)

4.  **Cloudflare Worker Setup:**
*   **Login to Cloudflare:**
    ```bash
    bunx wrangler login
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
bun run dev
```
The web application should now be running at `http://localhost:5173` (or similar).

### Electron Application (`apps/electron`)

```bash
cd apps/electron
bun run dev
```
This will launch the Electron desktop application.

### Convex Backend

The Convex backend runs automatically in the cloud. During development, changes to `packages/convex` functions are automatically deployed by the Convex CLI if `convex dev` is running (or `bun --cwd packages/convex run deploy` manually).

```bash
cd packages/convex
bun run dev # This command will watch for changes and deploy them
```

### Cloudflare Worker (`workers/bible-proxy`)

```bash
cd workers/bible-proxy
bun run dev
```
This will start a local development server for your Cloudflare Worker.

## Common Development Scripts

Check the `package.json` files in each `app/` and `package/` for specific scripts like `build`, `test`, `lint`, etc.
