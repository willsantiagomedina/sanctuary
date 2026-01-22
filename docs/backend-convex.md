# Backend: Convex Services (`packages/convex`)

The `packages/convex` directory houses the core backend logic for the Sanctuary application, leveraging Convex for real-time data storage, serverless functions (queries and mutations), and authentication. Convex provides a reactive database and a serverless platform that simplifies building real-time applications.

## Technologies Used

*   **Backend-as-a-Service**: Convex
*   **Language**: TypeScript
*   **Database**: Convex's document database

## Directory Structure

*   **`convex/`**: This is the primary directory for Convex-specific files.
    *   **`auth.config.ts`**: Configuration for authentication providers (e.g., Clerk, Auth0, custom solutions).
    *   **`bible.ts`**: Defines Convex functions (queries/mutations) and potentially schema aspects related to Bible data.
    *   **`bibleImport.ts`**: Likely contains functions for importing Bible data into the Convex database.
    *   **`live.ts`**: Functions related to real-time "live" features, such as active presentations or collaborative editing.
    *   **`organizations.ts`**: Functions and schema for managing organizations within the application (e.g., churches, groups).
    *   **`presentations.ts`**: Core functions and schema for creating, managing, and retrieving presentations.
    *   **`schema.ts`**: Defines the data schema for the Convex database, including table definitions and field types. This is critical for data integrity and type safety.
    *   **`seed.ts`**: Functions for seeding initial data into the Convex database, useful for development or fresh deployments.
    *   **`slides.ts`**: Functions specifically for managing individual slides within presentations.
    *   **`songs.ts`**: Functions and schema for managing a library of songs.
    *   **`users.ts`**: Functions and schema for managing user profiles and related data.
    *   **`_generated/`**: (Automatically generated) Contains TypeScript type definitions (`api.d.ts`, `dataModel.d.ts`, `server.d.ts`) that allow for type-safe interaction with Convex functions and data model from the frontend.

*   **`data/bibles/`**: Stores raw and converted Bible data files, likely used by the import scripts.
    *   `converted/`: Processed Bible data.
    *   `raw/`: Original Bible data files.

*   **`scripts/`**: Utility scripts related to Convex data management.
    *   `bible-datasets.json`: Configuration or metadata for Bible datasets.
    *   `convert-bibles.mjs`: Script to convert raw Bible data into a format suitable for import.
    *   `download-bibles.mjs`: Script to download raw Bible data.
    *   `import-bibles.mjs`: Script to import processed Bible data into Convex.

*   **`src/functions/`**: This directory contains the actual Convex functions (queries and mutations). Files like `bible.ts`, `live.ts`, etc., within this directory define the API endpoints that frontend applications interact with.

<h2>Key Convex Concepts</h2>

*   **Documents & Tables**: Data is stored in collections of documents (similar to NoSQL databases). The `schema.ts` file defines these tables and their validation rules.
*   **Queries**: Read-only functions that fetch data from the Convex database. They are reactive, meaning the frontend automatically re-renders when the data they query changes.
*   **Mutations**: Functions that modify data in the Convex database. They are transactional and ensure data consistency.
*   **Actions**: Functions that can perform side effects (e.g., call external APIs) and are not subject to the same reactivity constraints as queries.
*   **Authentication**: Convex provides built-in authentication mechanisms, often integrated with third-party providers. `auth.config.ts` configures this.

<h2>Development Workflow</h2>

During development, the Convex CLI (e.g., `pnpm convex dev`) watches for changes in this package, automatically deploying schema and function updates to your Convex development deployment.
