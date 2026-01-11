/**
 * Input Sanitization Utilities
 * Prevents XSS attacks by sanitizing user input
 * 
 * Note: For production, consider using DOMPurify library
 * Install with: npm install dompurify @types/dompurify
 */

/**
 * Sanitize HTML content to prevent XSS
 * This is a basic implementation. For production, use DOMPurify.
 */
export function sanitizeHtml(dirty: string): string {
  if (!dirty) return '';

  // Create a temporary div to parse HTML
  const temp = document.createElement('div');
  temp.textContent = dirty;

  // Get the sanitized text
  let sanitized = temp.innerHTML;

  // Allow only safe HTML tags


  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  // Remove data: protocol (can be used for XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return sanitized;
}

/**
 * Sanitize plain text input (removes all HTML)
 * Use this for user inputs that should not contain any HTML
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize URL to prevent javascript: and data: protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';

  try {
    const parsed = new URL(url);

    // Only allow http and https protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      console.warn(`Blocked potentially unsafe URL protocol: ${parsed.protocol}`);
      return '';
    }

    return parsed.toString();
  } catch (error) {
    // Invalid URL
    console.warn('Invalid URL provided:', url);
    return '';
  }
}

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';

  // Basic email validation and sanitization
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return '';
  }

  return email.toLowerCase().trim();
}

/**
 * Sanitize filename to prevent directory traversal
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return '';

  // Remove directory traversal attempts
  let sanitized = filename.replace(/\.\./g, '');

  // Remove path separators
  sanitized = sanitized.replace(/[\/\\]/g, '');

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Limit length
  if (sanitized.length > 255) {
    sanitized = sanitized.substring(0, 255);
  }

  return sanitized;
}

/**
 * Sanitize search query
 */
export function sanitizeSearchQuery(query: string): string {
  if (!query) return '';

  // Remove special regex characters that could cause issues
  return query
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .trim()
    .substring(0, 200); // Limit length
}

/**
 * Sanitize number input
 */
export function sanitizeNumber(input: string | number, options?: {
  min?: number;
  max?: number;
  integer?: boolean;
}): number | null {
  const num = typeof input === 'string' ? parseFloat(input) : input;

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  let sanitized = num;

  // Apply integer constraint
  if (options?.integer) {
    sanitized = Math.floor(sanitized);
  }

  // Apply min/max constraints
  if (options?.min !== undefined && sanitized < options.min) {
    sanitized = options.min;
  }
  if (options?.max !== undefined && sanitized > options.max) {
    sanitized = options.max;
  }

  return sanitized;
}

/**
 * Sanitize object keys to prevent prototype pollution
 */
export function sanitizeObjectKeys<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const key in obj) {
    // Skip prototype properties
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      continue;
    }

    // Skip dangerous keys
    if (['__proto__', 'constructor', 'prototype'].includes(key)) {
      console.warn(`Blocked potentially dangerous object key: ${key}`);
      continue;
    }

    sanitized[key] = obj[key];
  }

  return sanitized;
}

/**
 * Sanitize markdown content (basic)
 * For production, use a proper markdown sanitizer
 */
export function sanitizeMarkdown(markdown: string): string {
  if (!markdown) return '';

  // Remove HTML tags
  let sanitized = markdown.replace(/<[^>]*>/g, '');

  // Remove javascript: links
  sanitized = sanitized.replace(/\[([^\]]+)\]\(javascript:[^\)]*\)/gi, '[$1](#)');

  // Remove data: links
  sanitized = sanitized.replace(/\[([^\]]+)\]\(data:[^\)]*\)/gi, '[$1](#)');

  return sanitized;
}

/**
 * Create a safe component for rendering user HTML
 * Usage: <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(userContent) }} />
 */
export function createSafeHtml(html: string): { __html: string } {
  return { __html: sanitizeHtml(html) };
}

/**
 * Validate and sanitize form data
 */
export function sanitizeFormData<T extends Record<string, any>>(
  data: T,
  schema: Record<keyof T, 'string' | 'number' | 'email' | 'url'>
): Partial<T> {
  const sanitized: any = {};

  for (const key in schema) {
    const value = data[key];
    const type = schema[key];

    if (value === undefined || value === null) {
      continue;
    }

    switch (type) {
      case 'string':
        sanitized[key] = sanitizeInput(String(value));
        break;
      case 'number':
        sanitized[key] = sanitizeNumber(value);
        break;
      case 'email':
        sanitized[key] = sanitizeEmail(String(value));
        break;
      case 'url':
        sanitized[key] = sanitizeUrl(String(value));
        break;
    }
  }

  return sanitized;
}
