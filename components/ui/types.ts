import type { HTMLAttributes, ReactNode } from "react"
import type { VariantProps } from "class-variance-authority"

export interface ButtonProps extends HTMLAttributes<HTMLButtonElement> {
  children?: ReactNode
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

export interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode
  className?: string
  variant?: "default" | "secondary" | "destructive" | "outline"
}