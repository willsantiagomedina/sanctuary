# Cloudflare Worker: Bible Proxy (`workers/bible-proxy`)

The `workers/bible-proxy` package contains a Cloudflare Worker that acts as an edge computing service for the Sanctuary application. Its primary role is likely to efficiently handle requests related to Bible data, potentially by acting as a proxy, caching layer, or an API gateway to external Bible data sources.

## Technologies Used

*   **Platform**: Cloudflare Workers
*   **Language**: TypeScript

## Directory Structure

*   **`package.json`**: Worker-specific dependencies and scripts.
*   **`tsconfig.json`**: TypeScript configuration for the Worker.
*   **`wrangler.toml`**: The main configuration file for Cloudflare Workers, used by the `wrangler` CLI. It defines:
    *   Worker name and type.
    *   Entry point (`src/index.ts`).
    *   Environment variables.
    *   Routes and domains where the Worker should be active.
    *   Bindings to other Cloudflare services (e.g., KV, R2, D1).
*   **`src/`**: Contains the source code for the Cloudflare Worker.
    *   **`index.ts`**: The entry point for the Worker's logic, handling incoming requests and routing them or performing data operations.

## Purpose

The specific purpose of this Worker can vary, but common use cases for a "bible-proxy" might include:

*   **Caching Bible Data**: Storing frequently accessed Bible verses or chapters at the edge to reduce load on origin servers and provide faster responses to users globally.
*   **Proxying External APIs**: Forwarding requests to third-party Bible APIs, potentially adding authentication headers, transforming data, or handling rate limiting.
*   **Data Aggregation/Transformation**: Combining data from multiple sources or reformatting Bible content before sending it to the frontend or Convex backend.
*   **Authentication/Authorization**: Implementing edge-level checks for requests related to Bible data.
*   **Offloading Convex**: Reducing the number of requests directly hitting the Convex backend for static or easily cacheable Bible content.

<h2>Deployment</h2>

The Worker is deployed using the Cloudflare `wrangler` CLI. The `wrangler.toml` file dictates its deployment configuration, including the routes it will serve and any environment-specific settings. Development can be done locally using `wrangler dev`.
