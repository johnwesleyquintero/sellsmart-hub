# Import Guidelines

## Module Import Order
1. React and Next.js core imports
2. External dependencies
3. Internal components (@/components/*)
4. Internal utilities (@/lib/*)
5. Types and interfaces
6. Styles and assets

## Best Practices
1. Use named imports where possible
2. Use absolute imports with '@/' prefix
3. Group related imports together
4. Remove unused imports
5. Use dynamic imports for large components

## Type Imports
- Use `import type` or `import { type X }` for type-only imports
- Keep type imports separate from value imports

## Asset Imports
- Store images in /public/images/
- Use Next.js Image component
- Include width, height, and alt text
- Use blurDataURL for images above the fold

## Component Imports
- Use dynamic imports for large components
- Keep UI component imports grouped
- Import from specific paths rather than index files

## Common Patterns
```typescript
// Core imports
import { type ReactNode } from 'react'
import Image from 'next/image'

// External dependencies
import { motion } from 'framer-motion'
import { cva } from 'class-variance-authority'

// Internal components
import { Button } from '@/components/ui/button'

// Utilities
import { cn } from '@/lib/utils'

// Types
import type { Metadata } from 'next'
```