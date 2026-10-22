const AMOUNT_PATTERN = /^\d+(\.\d{1,2})?$/;

export function validateAmount(value) {
  const text = String(value ?? '').trim();
  if (!text) return 'Amount is required.';
  if (!AMOUNT_PATTERN.test(text)) {
    return Number(text) <= 0 || text.startsWith('-')
      ? 'Amount must be greater than zero.'
      : 'Amount must be a number with at most 2 decimal places.';
  }
  if (Number(text) <= 0) return 'Amount must be greater than zero.';
  return null;
}

function compact(errors) {
  return Object.fromEntries(Object.entries(errors).filter(([, message]) => message));
}

export function validateDonation(values) {
  return compact({
    donor_name: values.donor_name.trim() ? null : 'Donor name must not be empty.',
    amount: validateAmount(values.amount),
    date: values.date ? null : 'Date is required.',
  });
}

export function validateAllocation(values, availableBalance) {
  let amountError = validateAmount(values.amount);
  if (!amountError && availableBalance != null && Number(values.amount) > availableBalance) {
    amountError = 'Amount exceeds the available balance.';
  }
  return compact({
    cause_name: values.cause_name.trim() ? null : 'Cause name must not be empty.',
    amount: amountError,
  });
}
