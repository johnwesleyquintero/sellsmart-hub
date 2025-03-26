# UI Component Import Guidelines

## Button Component
- Import from '@/components/ui/button'
- Uses cva for variants
- Supports asChild prop for composition

## Badge Component
- Import from '@/components/ui/badge'
- Uses cva for variants
- No asChild support

## Image Usage
- Always use Next.js Image component for optimization
- Store images in /public/images/
- Use width and height props
- Include alt text
- Use priority for above-the-fold images

## Icons
- Import from lucide-react
- Use consistent sizing (h-4 w-4 or h-5 w-5)
- Add aria-label for accessibility when needed