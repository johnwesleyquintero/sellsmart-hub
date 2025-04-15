import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
// Utility for merging Tailwind CSS classes and styling
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
// Styling utilities
export const generateStyles = (baseStyles, conditionalStyles) => {
  return Object.entries(conditionalStyles)
    .filter(([, condition]) => condition)
    .map(([style]) => style)
    .concat(baseStyles)
    .join(' ');
};
// Core utility functions
export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};
// String manipulation utilities
export const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};
// Array utilities
export const chunk = (arr, size) => {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
};
// Object utilities
export const pick = (obj, keys) => {
  return keys.reduce((acc, currentKey) => {
    if (obj && Object.prototype.hasOwnProperty.call(obj, currentKey)) {
      acc[currentKey] = obj[currentKey];
    }
    return acc;
  }, {});
};
