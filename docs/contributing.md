# Contributing to Sanctuary

We welcome contributions to the Sanctuary project! By following these guidelines, you can help us maintain a high standard of quality and consistency in the codebase and documentation.

## How to Contribute

1.  **Fork the Repository**: Start by forking the Sanctuary repository to your GitHub account.
2.  **Clone Your Fork**: Clone your forked repository to your local machine.
    ```bash
    git clone https://github.com/your-username/sanctuary.git
    cd sanctuary
    ```
3.  **Set Up Development Environment**: Follow the instructions in `setup-development.md` to get your local environment running.
4.  **Create a New Branch**: Create a new branch for your feature or bug fix. Use a descriptive name (e.g., `feature/add-song-search`, `fix/login-bug`).
    ```bash
    git checkout -b feature/your-feature-name
    ```
5.  **Make Your Changes**: Implement your feature or fix your bug.
    *   Adhere to existing code style and architectural patterns.
    *   Write clear, concise code.
    *   Add tests for new features or bug fixes (see `testing.md`).
    *   Update documentation as necessary (e.g., `docs/`).
6.  **Run Tests**: Before committing, ensure all tests pass.
    ```bash
    pnpm test # Or specific test commands for affected packages
    ```
7.  **Lint and Format**: Ensure your code conforms to the project's linting and formatting rules.
    ```bash
    pnpm lint # (Assuming a lint script is available)
    pnpm format # (Assuming a format script is available)
    ```
8.  **Commit Your Changes**: Write a clear and descriptive commit message. Follow conventional commit guidelines if the project uses them.
    ```bash
    git commit -m "feat: Add new song search functionality"
    ```
9.  **Push to Your Fork**:
    ```bash
    git push origin feature/your-feature-name
    ```
10. **Open a Pull Request (PR)**:
    *   Go to the original Sanctuary repository on GitHub.
    *   You should see a prompt to open a new Pull Request from your recently pushed branch.
    *   Provide a clear title and detailed description of your changes.
    *   Reference any related issues.

## Code Style and Guidelines

*   **TypeScript**: All code should be written in TypeScript.
*   **ESLint/Prettier**: The project uses ESLint for linting and Prettier for code formatting. Ensure your IDE is configured to use these tools, or run them manually before committing.
*   **Conventional Commits**: (If applicable) Follow a conventional commit message format (e.g., `feat:`, `fix:`, `chore:`) for clarity and automated changelog generation.

## Issue Reporting

If you find a bug or have a feature request, please open an issue on the GitHub issue tracker.
*   Describe the issue clearly.
*   Provide steps to reproduce (for bugs).
*   Explain the expected and actual behavior.
*   Include relevant error messages or screenshots.

Thank you for contributing to Sanctuary!
