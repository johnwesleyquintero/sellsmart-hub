# Contributing Guidelines

## Getting Started

1. Fork the repository on GitHub
2. Clone your forked repository locally
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a new branch for your changes:
   ```bash
   git checkout -b feat/my-feature
   ```

## Development Standards

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint and Prettier configuration
- Use meaningful variable and function names
- Keep functions small and focused
- Add JSDoc comments for complex functions
- Use shadcn/ui components for UI elements

### Testing

- Write unit tests for utility functions
- Add integration tests for complex features
- Test both light and dark themes
- Ensure responsive design works on all breakpoints
- Test with sample CSV data for tools

### Documentation

- Update README.md for major features
- Document all new API endpoints
- Add TypeScript interfaces and types
- Include usage examples in comments
- Update tool documentation with new features

### Component Guidelines

- Use TypeScript for type safety
- Implement error boundaries where needed
- Add loading states for async operations
- Follow accessibility best practices
- Use React Server Components when possible

### Blog Posts

- Follow MDX formatting guidelines
- Include metadata for all posts
- Optimize images and SVGs
- Add alt text for accessibility
- Test rendering in both themes

## Making Changes

- Follow existing code style and patterns.
- Use npm for dependency management (e.g., `npm install`, `npm add <package>`).
- Add or update tests for new features and bug fixes.
- Update documentation—including README, error guides, and tool-specific docs—to reflect any code changes.
- Ensure all CI checks (linting, type-checks, tests) pass before submitting a pull request.

## Submitting Changes

1. Commit changes with descriptive messages
2. Push your branch to GitHub
3. Open a Pull Request against the main branch
4. Fill out the PR template completely
5. Request review from maintainers

Please adhere to the [GitHub Flow](https://guides.github.com/introduction/flow/) and maintain a respectful, collaborative environment.

## Package Manager

- Please use npm for managing dependencies
- Install npm if you haven't already:
  ```bash
  npm install -g npm
  ```
- Use npm commands for installing and managing packages:
  ```bash
  npm install
  npm add <package>
  ```

## Version Control

- Keep commits small and focused
- Use conventional commit messages
- Rebase feature branches on main
- Squash commits before merging
- Delete branches after merging
