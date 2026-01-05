// Convert datetime-local string to ISO string without timezone conversion
export const convertLocalDateTimeToISO = (localDateTimeString: string): string => {
  if (!localDateTimeString) return '';
  
  // For datetime-local strings (YYYY-MM-DDTHH:mm), we can send them directly
  // The backend will interpret them as local time when creating new Date()
  // We just need to add seconds to make it a complete ISO format
  return localDateTimeString + ':00';
};

// Format date to local datetime-local format for input
export const formatToLocalDateTime = (date: Date): string => {
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
  
  const nextDay = new Date(prevEndDate);
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