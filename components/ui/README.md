# UI Components

This directory contains reusable UI components built with shadcn/ui.

## Import Guidelines

1. **React/Next.js Core**

```typescript
import { type ReactNode } from "react";
import Image from "next/image";
```

2. **External Dependencies**

```typescript
import { cva } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";
```

3. **Internal Components/Utils**

```typescript
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
```

## Type Imports

- Use `type` keyword: `import type { ButtonProps } from "./types"`
- Group type imports at the top
- Use named imports for specific types

## Component Structure

1. Import statements (following order above)
2. Type definitions
3. Component variants (if using cva)
4. Component implementation
5. Export statements
