/**
 * Validation utilities for API routes
 */

export function validateRequired(data, fields) {
  const missingFields = fields.filter((field) => !data[field]);

  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateLength(value, min, max) {
  if (value.length < min) return false;
  if (max && value.length > max) return false;
  return true;
}

