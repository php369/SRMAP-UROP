// Convert datetime-local string to ISO string preserving local time
export const convertLocalDateTimeToISO = (localDateTimeString: string): string => {
  if (!localDateTimeString) return '';
  
  // Parse the datetime-local string manually to avoid timezone interpretation issues
  // Input format: "2024-01-15T14:30"
  const [datePart, timePart] = localDateTimeString.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  
  // Create date object using local timezone (this preserves the user's intended time)
  const localDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  
  // Return ISO string with timezone offset to preserve the local time context
  return localDate.toISOString();
};

// Format date to local datetime-local format for input
export const formatToLocalDateTime = (date: Date): string => {
  // Use local timezone methods to avoid UTC conversion issues
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Get default start date for next phase (next day after previous phase ends)
export const getDefaultStartDate = (prevEndDate: string): string => {
  if (!prevEndDate) return '';
  
  // Parse the previous end date properly to avoid timezone issues
  const prevDate = new Date(prevEndDate);
  const nextDay = new Date(prevDate.getTime());
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(9, 0, 0, 0); // Set to 9 AM next day
  
  const year = nextDay.getFullYear();
  const month = String(nextDay.getMonth() + 1).padStart(2, '0');
  const day = String(nextDay.getDate()).padStart(2, '0');
  const hours = String(nextDay.getHours()).padStart(2, '0');
  const minutes = String(nextDay.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

// Format date for display
export const formatDateForDisplay = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-IN', { 
    dateStyle: 'medium', 
    timeStyle: 'short',
    hour12: true 
  });
};

// Format date for short display
export const formatDateForShortDisplay = (dateString: string): string => {
  return new Date(dateString).toLocaleString('en-IN', { 
    dateStyle: 'short', 
    timeStyle: 'short',
    hour12: true 
  });
};