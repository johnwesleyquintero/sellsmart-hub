import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
export const exportFormats = ['CSV', 'Excel', 'PDF', 'JSON'];
export function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
export function calculatePercentage(base, total) {
  return total === 0 ? 0 : Math.round((base / total) * 100);
}
export function validateAmazonAsin(asin) {
  return /^[A-Z0-9]{10}$/.test(asin);
}
export function generateExportFilename(toolName, format) {
  const date = new Date().toISOString().slice(0, 10);
  return `${toolName.replace(/ /g, '-')}_${date}.${format.toLowerCase()}`;
}
export function parseCsvNumber(value) {
  const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
  return isNaN(num) ? 0 : num;
}
