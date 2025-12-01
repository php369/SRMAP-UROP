/**
 * Generate a 6-character alphanumeric code for group formation
 * Format: XXXXXX (uppercase letters and numbers)
 */
export function generateGroupCode(): string {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    code += characters[randomIndex];
  }
  
  return code;
}

/**
 * Validate a group code format
 */
export function isValidGroupCode(code: string): boolean {
  const codeRegex = /^[A-Z0-9]{6}$/;
  return codeRegex.test(code);
}

/**
 * Format a group code for display (adds hyphen in middle)
 * Example: ABC123 -> ABC-123
 */
export function formatGroupCode(code: string): string {
  if (code.length !== 6) return code;
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}
