/**
 * Format user name for display
 * If the name looks like an ID (long string without spaces), extract from email instead
 */
export function formatDisplayName(name: string, email: string): string {
  // Check if name looks like an ID (more than 30 chars and no spaces)
  if (name && name.length > 30 && !name.includes(' ')) {
    // Extract name from email (before @)
    const emailName = email.split('@')[0];
    // Replace dots and underscores with spaces and capitalize
    return emailName
      .replace(/[._]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim();
  }
  
  return name || email.split('@')[0];
}
