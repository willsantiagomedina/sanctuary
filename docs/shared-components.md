# Shared Components & UI Library

The Sanctuary project leverages pnpm workspaces to manage shared code and UI components across different applications, promoting reusability, consistency, and efficient development. This section details the contents and purpose of the `shared` and `ui` packages.

## `packages/shared`

This package is designed to host common utilities, constants, types, and interfaces that are used by both frontend applications (`apps/web`, `apps/electron`) and backend services (`packages/convex`). Its primary goal is to ensure type safety and consistency across the entire monorepo.

### Directory Structure

*   **`src/`**: Contains the source code for shared utilities.
    *   **`index.ts`**: The main entry point for the shared package, exporting all public modules.
    *   **`constants/`**: Defines application-wide constants.
        *   `index.ts`: Exports various constants.
    *   **`types/`**: Contains common TypeScript type definitions and interfaces.
        *   `index.ts`: Exports various shared types.

### Purpose

*   **Type Safety**: Centralizes type definitions, allowing for consistent data structures across the frontend and backend, reducing errors during development.
*   **Code Reusability**: Provides common functions or values that can be imported and used anywhere in the monorepo without duplication.
*   **Consistency**: Ensures that fundamental aspects like API responses, data models, or configuration values are uniformly defined.

## `packages/ui`

This package serves as the project's UI component library, built using React and styled with Tailwind CSS. It provides a set of pre-built, reusable UI components that adhere to the project's design system, ensuring a consistent look and feel across all frontend applications.

### Technologies Used

*   **Framework**: React
*   **Styling**: Tailwind CSS, Radix UI (inferred from common patterns of component names like `alert-dialog`, `avatar`, `button` etc.)

### Directory Structure

*   **`src/`**: Contains the source code for the UI components.
    *   **`index.ts`**: The main entry point for the UI package, exporting all public components.
    *   **`components/`**: Individual UI components, often organized by their functionality or type. Examples include:
        *   `alert-dialog.tsx`
        *   `avatar.tsx`
        *   `badge.tsx`
        *   `button.tsx`
        *   `card.tsx`
        *   `command-palette.tsx`
        *   `context-menu.tsx`
        *   `dialog.tsx`
        *   `dropdown-menu.tsx`
        *   `hover-card.tsx`
        *   `input.tsx`
        *   `label.tsx`
        *   `popover.tsx`
        *   `progress.tsx`
        *   `scroll-area.tsx`
        *   `separator.tsx`
        *   `skeleton.tsx`
        *   `slider.tsx`
        *   `sonner.tsx` (toast notifications)
        *   `switch.tsx`
        *   `tabs.tsx`
        *   `tooltip.tsx`
    *   **`lib/`**: Utility functions or helper modules specific to the UI components.
        *   `utils.ts`: Common utility functions for UI components (e.g., class merging).

### Purpose

*   **Design System Enforcement**: Ensures all UI elements conform to a consistent design language.
*   **Accelerated Development**: Developers can quickly assemble UIs using pre-built and tested components.
*   **Maintainability**: Changes to the design or styling of a component can be made in one place and propagated across all applications that use it.
*   **Accessibility**: Components are built with accessibility best practices in mind, benefiting all applications.
