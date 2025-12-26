import { CaseCategory, CasePriority } from '@prisma/client';

export interface CaseRow {
  case_id: string;
  applicant_name: string;
  dob: string;
  email?: string;
  phone?: string;
  category: string;
  priority?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// E.164 phone format: +[country code][number]
const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

export function validateCaseRow(row: CaseRow, rowIndex: number): ValidationResult {
  const errors: string[] = [];

  // case_id validation
  if (!row.case_id || !row.case_id.trim()) {
    errors.push('case_id is required');
  }

  // applicant_name validation
  if (!row.applicant_name || !row.applicant_name.trim()) {
    errors.push('applicant_name is required');
  }

  // dob validation
  if (!row.dob) {
    errors.push('dob is required');
  } else {
    const dob = new Date(row.dob);
    const today = new Date();
    const minDate = new Date('1900-01-01');

    if (isNaN(dob.getTime())) {
      errors.push('dob must be a valid ISO date (YYYY-MM-DD)');
    } else if (dob < minDate) {
      errors.push('dob must be after 1900-01-01');
    } else if (dob > today) {
      errors.push('dob cannot be in the future');
    }
  }

  // email validation (optional)
  if (row.email && row.email.trim()) {
    if (!EMAIL_REGEX.test(row.email)) {
      errors.push('email must be a valid email address');
    }
  }

  // phone validation (optional)
  if (row.phone && row.phone.trim()) {
    // Try to normalize first
    const normalized = normalizePhone(row.phone);
    if (!PHONE_REGEX.test(normalized)) {
      errors.push('phone must be in E.164 format (+[country code][number])');
    }
  }

  // category validation
  const validCategories: CaseCategory[] = ['TAX', 'LICENSE', 'PERMIT'];
  if (!row.category || !validCategories.includes(row.category as CaseCategory)) {
    errors.push(`category must be one of: ${validCategories.join(', ')}`);
  }

  // priority validation (optional, defaults to LOW)
  if (row.priority) {
    const validPriorities: CasePriority[] = ['LOW', 'MEDIUM', 'HIGH'];
    if (!validPriorities.includes(row.priority as CasePriority)) {
      errors.push(`priority must be one of: ${validPriorities.join(', ')}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function normalizeCaseData(row: any): CaseRow {
  return {
    case_id: String(row.case_id || row.caseId || '').trim(),
    applicant_name: String(row.applicant_name || row.applicantName || '').trim(),
    dob: String(row.dob || row.dateOfBirth || '').trim(),
    email: row.email ? String(row.email).trim() : undefined,
    phone: row.phone ? normalizePhone(String(row.phone).trim()) : undefined,
    category: String(row.category || '').trim().toUpperCase(),
    priority: row.priority ? String(row.priority).trim().toUpperCase() : undefined,
  };
}

export function normalizePhone(phone: string): string {
  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '');

  // If it doesn't start with +, try to add country code
  if (!cleaned.startsWith('+')) {
    // Common patterns: assume US (+1) if 10 digits, India (+91) if starts with 9
    if (cleaned.length === 10) {
      cleaned = '+1' + cleaned;
    } else if (cleaned.length === 12 && cleaned.startsWith('91')) {
      cleaned = '+' + cleaned;
    } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
      cleaned = '+' + cleaned;
    } else {
      // Default: add + if missing
      cleaned = '+' + cleaned;
    }
  }

  return cleaned;
}

// Fix All helpers
export function trimWhitespace(value: string): string {
  return value.trim();
}

export function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function normalizePhoneHelper(phone: string): string {
  return normalizePhone(phone);
}

