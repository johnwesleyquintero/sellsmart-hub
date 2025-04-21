import DOMPurify from 'dompurify';

export const sanitizeHtml = (dirty: string): string => {
  try {
    return DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
      ALLOWED_ATTR: ['class', 'style'],
    });
  } catch (error) {
    console.error('HTML sanitization error:', error);
    return '';
  }
};
