/**
 * Format user name for display
 * If the name looks like an ID (long string without spaces), extract from email instead
 */
export function formatDisplayName(name: string, email: string): string {
  // Check if name is missing, empty, or looks like an ID/token
  // Conditions: more than 30 chars without spaces, contains special chars like /, @, or looks like a hash
  const looksLikeId = name && (
    (name.length > 30 && !name.includes(' ')) ||
    name.includes('/') ||
    (name.includes('@') && name !== email) ||
    /^[a-zA-Z0-9+/=]{20,}$/.test(name) // Base64-like pattern
  );

  if (!name || looksLikeId) {
    // Extract name from email (before @)
    const emailName = email.split('@')[0];
    // Replace dots, underscores, and numbers with spaces and capitalize
    return emailName
      .replace(/[._\d]/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .trim();
  }

  return name;
}
