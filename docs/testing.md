# Testing

This document outlines the testing strategy for the Sanctuary project, focusing on how different parts of the monorepo are tested to ensure quality and reliability.

## Overview

The project leverages TypeScript across all packages, which provides a strong foundation for type safety at compile time. However, robust testing is essential to cover runtime behavior, business logic, and user interface interactions.

Given the monorepo structure, testing approaches may vary slightly for each package:

*   **Unit Tests**: For individual functions, components, and Convex queries/mutations.
*   **Integration Tests**: For verifying interactions between different modules or services.
*   **End-to-End (E2E) Tests**: For simulating user flows through the entire application (web and Electron).

## General Testing Practices

*   **Test Runner**: Given a JavaScript/TypeScript ecosystem, popular choices like Vitest (for Vite projects), Jest, or others could be used. You would typically find configuration in `package.json` scripts or dedicated config files.
*   **Assertions Library**: Expect-style assertions (e.g., `expect` from Jest/Vitest).

<h2>Testing Each Component</h2>

<h3>Web Application (`apps/web`)</h3>

*   **Unit Tests**: Components and hooks can be unit tested using a testing library like React Testing Library (for components) and Vitest/Jest (for general logic).
    *   Test files would typically reside alongside the code they test (e.g., `Component.test.tsx` next to `Component.tsx`).
*   **Integration Tests**: Could involve testing interactions between multiple components or with the Convex client in a mocked environment.
*   **E2E Tests**: Frameworks like Cypress or Playwright could be used to simulate user interactions across the web application.

<h3>Electron Application (`apps/electron`)</h3>

*   **Unit Tests**: Main process, preload scripts, and any Electron-specific utilities can be unit tested.
*   **E2E Tests**: Frameworks like Spectron (built on top of WebDriverIO) are specifically designed for testing Electron applications, simulating user interactions and checking native features.

<h3>Convex Backend (`packages/convex`)</h3>

Convex functions (queries, mutations, actions) are critical parts of the backend and require thorough testing.

*   **Unit Tests**: Individual Convex functions can be tested in isolation using Convex's testing utilities, which allow mocking the database and user context.
    *   Test files might be located in a `__tests__` directory within `packages/convex/convex/` or alongside the function files.
*   **Schema Validation**: Convex enforces schema validation, which acts as a form of testing for data integrity.

<h3>Shared Packages (`packages/shared` & `packages/ui`)</h3>

*   **`packages/shared`**: Unit tests for utilities, constants, and type helpers.
*   **`packages/ui`**: Unit tests for individual UI components, ensuring they render correctly, respond to props, and handle user interactions as expected (e.g., using React Testing Library).

<h3>Cloudflare Worker (`workers/bible-proxy`)</h3>

*   **Unit Tests**: The logic within `src/index.ts` can be unit tested using a test runner. Cloudflare Workers often have specific testing environments or mock objects for fetch requests and other Worker APIs.
*   **Integration Tests**: Testing the Worker's interaction with external APIs or Cloudflare services (KV, R2) would require integration testing.

<h2>Running Tests</h2>

Refer to the `package.json` files in each application and package for specific test scripts. Common commands might include:

*   `bun run test` (at the root or within a package)
*   `bun run jest`
*   `bun run vitest`
