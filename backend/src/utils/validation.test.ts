import { describe, it, expect } from 'vitest';
import { validateCaseRow, normalizeCaseData, normalizePhone } from './validation';

describe('validation', () => {
  describe('validateCaseRow', () => {
    it('should validate a correct row', () => {
      const row = {
        case_id: 'C-1001',
        applicant_name: 'John Doe',
        dob: '1990-01-01',
        email: 'john@example.com',
        phone: '+1234567890',
        category: 'TAX',
        priority: 'HIGH',
      };

      const result = validateCaseRow(row, 0);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing required fields', () => {
      const row = {
        case_id: '',
        applicant_name: '',
        dob: '',
        category: 'TAX',
      };

      const result = validateCaseRow(row, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid email', () => {
      const row = {
        case_id: 'C-1001',
        applicant_name: 'John Doe',
        dob: '1990-01-01',
        email: 'invalid-email',
        category: 'TAX',
      };

      const result = validateCaseRow(row, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('email'))).toBe(true);
    });

    it('should reject invalid date', () => {
      const row = {
        case_id: 'C-1001',
        applicant_name: 'John Doe',
        dob: '2090-01-01', // Future date
        category: 'TAX',
      };

      const result = validateCaseRow(row, 0);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('dob'))).toBe(true);
    });
  });

  describe('normalizePhone', () => {
    it('should normalize US phone number', () => {
      expect(normalizePhone('1234567890')).toBe('+11234567890');
    });

    it('should keep E.164 format', () => {
      expect(normalizePhone('+1234567890')).toBe('+1234567890');
    });

    it('should handle phone with spaces', () => {
      expect(normalizePhone('+1 234 567 890')).toBe('+1234567890');
    });
  });

  describe('normalizeCaseData', () => {
    it('should normalize case data', () => {
      const row = {
        case_id: '  C-1001  ',
        applicant_name: '  john doe  ',
        dob: '1990-01-01',
        category: 'tax',
        priority: 'high',
      };

      const normalized = normalizeCaseData(row);
      expect(normalized.case_id).toBe('C-1001');
      expect(normalized.applicant_name).toBe('john doe');
      expect(normalized.category).toBe('TAX');
      expect(normalized.priority).toBe('HIGH');
    });
  });
});

