import { validateEmail, validatePassword, validatePasswordMatch } from '../../src/utils/validation';

describe('validateEmail', () => {
  it('returns null for a valid email', () => {
    expect(validateEmail('user@example.com')).toBeNull();
  });

  it('returns error for empty string', () => {
    expect(validateEmail('')).toBe('Email is required');
  });

  it('returns error for whitespace only', () => {
    expect(validateEmail('   ')).toBe('Email is required');
  });

  it('returns error for missing @', () => {
    expect(validateEmail('userexample.com')).toBe('Invalid email format');
  });

  it('returns error for missing domain', () => {
    expect(validateEmail('user@')).toBe('Invalid email format');
  });

  it('returns error for missing TLD', () => {
    expect(validateEmail('user@example')).toBe('Invalid email format');
  });
});

describe('validatePassword', () => {
  it('returns null for a valid password', () => {
    expect(validatePassword('secret123')).toBeNull();
  });

  it('returns error for empty password', () => {
    expect(validatePassword('')).toBe('Password is required');
  });

  it('returns error for password shorter than 6 chars', () => {
    expect(validatePassword('abc')).toBe('Password must be at least 6 characters');
  });

  it('returns null for exactly 6 chars', () => {
    expect(validatePassword('abcdef')).toBeNull();
  });
});

describe('validatePasswordMatch', () => {
  it('returns null when passwords match', () => {
    expect(validatePasswordMatch('secret123', 'secret123')).toBeNull();
  });

  it('returns error when passwords do not match', () => {
    expect(validatePasswordMatch('secret123', 'different')).toBe('Passwords do not match');
  });
});
