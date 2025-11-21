/**
 * Validation utilities for forms and user input
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate cron expression format
 * Supports standard 5-field cron: minute hour day month weekday
 */
export function validateCronExpression(expression: string): ValidationResult {
  const errors: string[] = [];
  
  if (!expression || !expression.trim()) {
    errors.push('Cron expression is required');
    return { isValid: false, errors };
  }

  const trimmed = expression.trim();
  const parts = trimmed.split(/\s+/);
  
  if (parts.length !== 5) {
    errors.push('Cron expression must have exactly 5 fields: minute hour day month weekday');
    return { isValid: false, errors };
  }

  const [minute, hour, day, month, weekday] = parts;

  // Validate minute (0-59)
  if (!isValidCronField(minute, 0, 59)) {
    errors.push('Minute must be 0-59, *, */n, or a valid range');
  }

  // Validate hour (0-23)
  if (!isValidCronField(hour, 0, 23)) {
    errors.push('Hour must be 0-23, *, */n, or a valid range');
  }

  // Validate day (1-31)
  if (!isValidCronField(day, 1, 31)) {
    errors.push('Day must be 1-31, *, */n, or a valid range');
  }

  // Validate month (1-12)
  if (!isValidCronField(month, 1, 12)) {
    errors.push('Month must be 1-12, *, */n, or a valid range');
  }

  // Validate weekday (0-7, where 0 and 7 are Sunday)
  if (!isValidCronField(weekday, 0, 7)) {
    errors.push('Weekday must be 0-7, *, */n, or a valid range');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a single cron field
 */
function isValidCronField(field: string, min: number, max: number): boolean {
  // Wildcard
  if (field === '*') return true;

  // Step values (*/n)
  if (field.startsWith('*/')) {
    const step = parseInt(field.substring(2));
    return !isNaN(step) && step > 0 && step <= max;
  }

  // Range (n-m)
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(n => parseInt(n));
    return !isNaN(start) && !isNaN(end) && start >= min && end <= max && start <= end;
  }

  // List (n,m,o)
  if (field.includes(',')) {
    const values = field.split(',').map(n => parseInt(n));
    return values.every(v => !isNaN(v) && v >= min && v <= max);
  }

  // Single number
  const num = parseInt(field);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Validate URL format
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];
  
  if (!url || !url.trim()) {
    errors.push('URL is required');
    return { isValid: false, errors };
  }

  try {
    const parsed = new URL(url);
    
    // Must be http or https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      errors.push('URL must use http:// or https:// protocol');
    }
    
    // Must have a host
    if (!parsed.host) {
      errors.push('URL must have a valid host');
    }
  } catch (error) {
    errors.push('Invalid URL format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate email address format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];
  
  if (!email || !email.trim()) {
    errors.push('Email is required');
    return { isValid: false, errors };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    errors.push('Invalid email format');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate required string field
 */
export function validateRequired(value: string, fieldName: string): ValidationResult {
  const errors: string[] = [];
  
  if (!value || !value.trim()) {
    errors.push(`${fieldName} is required`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate interval format (e.g., "5m", "1h", "2d")
 */
export function validateInterval(interval: string): ValidationResult {
  const errors: string[] = [];
  
  if (!interval || !interval.trim()) {
    errors.push('Interval is required');
    return { isValid: false, errors };
  }

  const intervalPattern = /^(\d+)(m|h|d|w)$/;
  if (!intervalPattern.test(interval.trim())) {
    errors.push('Interval must be in format: 5m, 1h, 2d, 1w (number + unit)');
    return { isValid: false, errors };
  }

  const match = interval.match(intervalPattern);
  if (match) {
    const value = parseInt(match[1]);
    if (value <= 0) {
      errors.push('Interval value must be greater than 0');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Combine multiple validation results
 */
export function combineValidationResults(...results: ValidationResult[]): ValidationResult {
  const allErrors = results.flatMap(r => r.errors);
  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: string[]): string {
  if (errors.length === 0) return '';
  if (errors.length === 1) return errors[0];
  return '• ' + errors.join('\n• ');
}
