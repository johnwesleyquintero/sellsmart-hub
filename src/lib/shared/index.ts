// Shared utility functions and constants

// Color utility functions
export const getContrastColor = (bgColor: string): string => {
  // Convert hex to RGB and calculate relative luminance
  const hex = bgColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 2), 16) / 255;
  const b = parseInt(hex.slice(4, 2), 16) / 255;
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

// Animation utility functions
export const getTransitionStyles = (duration: number = 300) => ({
  transition: `all ${duration.toString()}ms ease-in-out`,
});

// Layout utility functions
export const getResponsiveStyles = (base: number, scale: number = 1.2) => ({
  small: `${base.toString()}px`,
  medium: `${(base * scale).toString()}px`, 
  large: `${(base * scale * scale).toString()}px`,
});

// Theme constants
export const THEME_CONSTANTS = {
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '2rem',
    xl: '4rem',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
} as const;

// Accessibility utilities
export const a11yProps = {
  skipLink: {
    className: 'sr-only focus:not-sr-only',
    href: '#main-content',
    children: 'Skip to main content',
  },
  ariaLabel: (label: string) => ({ 'aria-label': label }),
  ariaHidden: (hidden: boolean) => ({ 'aria-hidden': hidden }),
};
