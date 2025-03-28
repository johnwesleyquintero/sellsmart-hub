# Package Dependencies Documentation

## Core Dependencies

### Framework

- `next` (14.1.3) - React framework for production
- `react` (18.2.0) - UI library
- `react-dom` (18.2.0) - React DOM renderer

### UI Components (@radix-ui)

All UI components are from Radix UI's primitive collection:

- `@radix-ui/react-accordion` - Expandable content sections
- `@radix-ui/react-alert-dialog` - Modal dialogs for important actions
- `@radix-ui/react-aspect-ratio` - Responsive image containers
- `@radix-ui/react-avatar` - User avatars and images
- `@radix-ui/react-dialog` - Modal windows
- `@radix-ui/react-dropdown-menu` - Dropdown menus
- `@radix-ui/react-navigation-menu` - Navigation components

### Styling Utilities

- `class-variance-authority` - Component variant management
- `tailwind-merge` - Tailwind class merging
- `tailwindcss-animate` - Animation utilities

### Content Management

- `@mdx-js/loader` - MDX processing
- `@mdx-js/react` - MDX React components
- `@next/mdx` - Next.js MDX integration
- `next-mdx-remote` - Remote MDX content loading

### Form Handling

- `react-hook-form` - Form state management
- `zod` - Schema validation
- `papaparse` - CSV parsing

### UI Enhancement

- `framer-motion` - Animation library
- `next-themes` - Theme management
- `sonner` - Toast notifications
- `vaul` - Drawer components

## Development Dependencies

### Testing

- `@testing-library/jest-dom` - DOM testing utilities
- `@testing-library/react` - React testing utilities
- `@types/jest` - TypeScript types for Jest

### TypeScript

- `@types/node` - Node.js type definitions
- `@types/react` - React type definitions
- `@types/react-dom` - React DOM type definitions
- `typescript` - TypeScript compiler

### Build Tools

- `autoprefixer` - CSS vendor prefixing
- `postcss` - CSS processing
- `tailwindcss` - Utility-first CSS framework

### Code Quality

- `eslint` - Code linting
- `eslint-config-next` - Next.js ESLint rules
- `prettier` - Code formatting
- `lint-staged` - Pre-commit linting

### Development Utilities

- `cross-env` - Environment variable setting
- `npm-run-all` - Run multiple npm scripts
- `serve` - Static file serving
- `husky` - Git hooks

## Version Management

```json
"engines": {
  "node": ">=18.17.0",
  "pnpm": ">=8.15.0"
}
```

## Scripts Documentation

### Development

- `dev` - Start development server
- `dev:debug` - Start with debugging
- `build` - Production build
- `start` - Start production server

### Quality Checks

- `format` - Format code
- `lint` - Check code style
- `type-check` - Check types
- `check:all` - Run all checks

### Testing

- `test` - Run tests
- `test:watch` - Watch mode
- `test:coverage` - Coverage report
- `test:e2e` - E2E tests

### Maintenance

- `clean` - Clean build files
- `clean:all` - Clean all generated files
- `audit` - Security audit
