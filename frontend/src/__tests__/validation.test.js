import { describe, expect, it } from 'vitest';
import { validateAllocation, validateAmount, validateDonation } from '../validation.js';

describe('validateAmount', () => {
  it.each([
    ['', 'Amount is required.'],
    ['0', 'Amount must be greater than zero.'],
    ['-5', 'Amount must be greater than zero.'],
    ['1.005', 'Amount must be a number with at most 2 decimal places.'],
    ['abc', 'Amount must be a number with at most 2 decimal places.'],
  ])('rejects %j', (value, message) => {
    expect(validateAmount(value)).toBe(message);
  });

  it.each(['1', '10.5', '99.99'])('accepts %j', (value) => {
    expect(validateAmount(value)).toBeNull();
  });
});

describe('validateDonation', () => {
  it('requires donor name, positive amount, and date', () => {
    expect(validateDonation({ donor_name: '  ', amount: '0', date: '' })).toEqual({
      donor_name: 'Donor name must not be empty.',
      amount: 'Amount must be greater than zero.',
      date: 'Date is required.',
    });
  });

  it('passes valid input', () => {
    expect(validateDonation({ donor_name: 'Asha', amount: '100', date: '2024-05-01' })).toEqual({});
  });
});

describe('validateAllocation', () => {
  it('rejects amounts above the available balance', () => {
    expect(validateAllocation({ cause_name: 'Food', amount: '501' }, 500)).toEqual({
      amount: 'Amount exceeds the available balance.',
    });
    expect(validateAllocation({ cause_name: 'Food', amount: '500' }, 500)).toEqual({});
  });
});
