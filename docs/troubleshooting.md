# Troubleshooting

This document provides solutions to common issues that may arise during the development, building, or deployment of the Sanctuary application.

## General Monorepo Issues

<h3>`pnpm install` or `pnpm dev` fails</h3>

*   **Node.js Version**: Ensure you are using the recommended Node.js version (as specified in `setup-development.md`). Use `nvm use` or `volta use` if you manage multiple Node.js versions.
*   **Corrupt `node_modules`**: Try clearing the pnpm cache and reinstalling:
    ```bash
    pnpm store prune
    rm -rf node_modules
    pnpm install
    ```
*   **Workspace Configuration**: Verify `pnpm-workspace.yaml` is correctly configured and that your package `package.json` files have correct `name` and `dependencies`/`devDependencies` declarations.

<h3>TypeScript errors (`tsc` or IDE errors)</h3>

*   **Dependencies**: Ensure all dependencies are installed (`pnpm install`).
*   **`tsconfig.json`**: Check that your `tsconfig.json` files are correctly configured, especially `references` in the root `tsconfig.json` and `paths` if used for module resolution.
*   **Type Declaration Files**: Sometimes, type definitions might be missing or incorrect for certain packages. Try installing specific `@types/` packages if available.

<h2>Frontend (Web/Electron) Issues</h2>

<h3>Application not starting or blank screen</h3>

*   **Port Conflict**: Ensure the development port (e.g., 5173 for Vite) is not already in use.
*   **Environment Variables**: Double-check that `.env` files are correctly set up and environment variables are accessible.
*   **Build Errors**: If using a production build, ensure the build process (`pnpm build`) completed without errors.
*   **Convex Client Connection**: The frontend relies heavily on Convex. Check your browser's developer console for errors related to Convex connection or queries. Ensure your Convex deployment is active and accessible.

<h3>UI not updating or stale data</h3>

*   **Convex Reactivity**: Convex is designed for real-time updates. If data isn't refreshing, check:
    *   Are you using `useQuery` correctly for reactive data?
    *   Are there any errors in your Convex mutations?
    *   Is your local Convex development server (`pnpm convex dev`) running and correctly pushing changes?
*   **Browser Cache**: Hard refresh the browser (`Ctrl+Shift+R` or `Cmd+Shift+R`).

<h2>Backend (Convex) Issues</h2>

<h3>Convex functions not deploying or errors in logs</h3>

*   **Convex CLI Login**: Ensure you are logged in to the Convex CLI (`npx convex login`).
*   **Project Link**: Verify your local `packages/convex` is correctly linked to your Convex project (`.convex/config.json`).
*   **Schema Errors**: Check the Convex dashboard for schema validation errors.
*   **Function Logs**: Examine the Convex dashboard logs for detailed error messages from your queries, mutations, or actions.
*   **Dependencies**: Ensure `packages/convex/package.json` has all necessary dependencies declared and `pnpm install` has been run within the workspace.

<h3>Data not persisting or unexpected data state</h3>

*   **Mutation Logic**: Carefully review your Convex mutation functions for logical errors or incorrect updates.
*   **Schema Violations**: Attempts to write data that doesn't conform to your `schema.ts` will be rejected. Check for these errors in Convex logs.

<h2>Cloudflare Worker Issues</h2>

<h3>Worker not responding or incorrect behavior</h3>

*   **`wrangler.toml` Configuration**: Verify `wrangler.toml` for correct `route` patterns, environment variables, and bindings.
*   **`wrangler dev`**: Use `wrangler dev` to test the worker locally and see detailed logs in your terminal.
*   **Cloudflare Dashboard**: Check the Worker's dashboard in Cloudflare for logs and monitoring.
*   **Deployment Status**: Ensure the worker is successfully deployed and active.

<h2>Reporting Bugs</h2>

If you encounter an issue not covered here, or suspect a bug in the application, please:

1.  **Search Existing Issues**: Check the project's issue tracker (e.g., GitHub Issues) to see if it has already been reported.
2.  **Provide Detailed Information**: When creating a new issue, include:
    *   Steps to reproduce the bug.
    *   Expected vs. actual behavior.
    *   Screenshots or video (if UI-related).
    *   Error messages from console, network tab, or terminal.
    *   Your operating system and browser/Electron version.
