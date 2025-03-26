# Import Patterns in Components

## React and Next.js Imports
```typescript
import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
```

## UI Component Imports
```typescript
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
```

## Utility Imports
```typescript
import { cn } from "@/lib/utils"
import { externalLinks } from "@/lib/config/external-links"
```

## Type Imports
- Use `components/ui/types.ts` for UI component types
- Import types with the `type` keyword: `import type { ButtonProps } from "./types"`
- Prefer named imports for types

## Local Assets
- Store images in `/public/images/`
- Use relative paths for local components
- Use absolute paths with `@/` for shared components