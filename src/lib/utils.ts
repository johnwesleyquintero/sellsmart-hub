import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for merging Tailwind CSS classes and styling
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Styling utilities
export const generateStyles = (
  baseStyles: string,
  conditionalStyles: Record<string, boolean>,
) => {
  return Object.entries(conditionalStyles)
    .filter(([, condition]) => condition)
    .map(([style]) => style)
    .concat(baseStyles)
    .join(' ');
};

// Core utility functions
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

// String manipulation utilities
export const slugify = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

// Array utilities
export const chunk = <T>(arr: T[], size: number): T[][] => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
};

// Object utilities
export const pick = <T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> => {
  return keys.reduce(
    (acc, currentKey) => {
      if (obj && Object.prototype.hasOwnProperty.call(obj, currentKey)) {
        acc[currentKey] = obj[currentKey];
      }
      return acc;
    },
    {} as Pick<T, K>,
  );
};
