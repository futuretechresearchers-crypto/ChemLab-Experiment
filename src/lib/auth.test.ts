import { describe, expect, it } from 'vitest';
import { sanitizeReturnTo } from './auth';

describe('auth helpers', () => {
  it('keeps local safe activity paths', () => {
    expect(sanitizeReturnTo('/activity/ABC123')).toBe('/activity/ABC123');
  });

  it('blocks open redirect attempts', () => {
    expect(sanitizeReturnTo('https://evil.example')).toBe('/');
    expect(sanitizeReturnTo('//evil.example')).toBe('/');
  });
});
