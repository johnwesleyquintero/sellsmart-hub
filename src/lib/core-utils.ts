export const exportFormats = ['CSV', 'Excel', 'PDF', 'JSON'] as const;

export type ExportFormat = (typeof exportFormats)[number];

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

export function generateId(prefix = ''): string {
  const randomPart = Math.random().toString(36).slice(2, 9);
  return `${Date.now()}-${prefix}${randomPart}`;
}

import { truncate } from 'lodash-es';

export function truncateText(text: string, maxLength = 100): string {
  return truncate(text, { length: maxLength, omission: '...' });
}
