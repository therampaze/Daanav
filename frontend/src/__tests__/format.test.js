import { describe, expect, it } from 'vitest';
import { formatINR } from '../format.js';

describe('formatINR', () => {
  it('formats amounts in Indian rupees with lakh grouping', () => {
    expect(formatINR(150000.5)).toBe('₹1,50,000.50');
    expect(formatINR(0)).toBe('₹0.00');
  });
});
