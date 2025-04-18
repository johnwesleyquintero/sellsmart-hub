import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type { ClassValue } from 'clsx';

export const exportFormats = ['CSV', 'Excel', 'PDF', 'JSON'] as const;

export type ExportFormat = (typeof exportFormats)[number];
