import { format, parseISO, isValid } from 'date-fns';

/**
 * Validates and normalizes date strings to ISO format
 * @param date - Date string to validate and normalize
 * @returns Normalized ISO date string or current date if invalid
 */
export const validateAndNormalizeDate = (date: unknown): string => {
  // Handle null or undefined
  if (date == null) return new Date().toISOString();

  // Convert to string if not already
  const dateString = String(date);

  try {
    // Try parsing the date
    const parsedDate = parseISO(dateString);
    
    // Check if the date is valid
    if (isValid(parsedDate)) {
      // Return in consistent ISO format (YYYY-MM-DD)
      return format(parsedDate, 'yyyy-MM-dd');
    }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    console.warn(`Invalid date format: ${dateString}`);
  }

  // Fallback to current date if parsing fails
  return new Date().toISOString();
};

/**
 * Safely converts a value to a number with a default
 * @param value - Value to convert
 * @param defaultValue - Default value if conversion fails
 * @returns Converted number or default
 */
export const safeNumberConvert = (value: unknown, defaultValue = 0): number => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};