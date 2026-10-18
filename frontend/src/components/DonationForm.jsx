import { useState } from 'react';
import { todayISO } from '../format.js';
import { validateDonation } from '../validation.js';
import Field from './Field.jsx';
import { ErrorMessage } from './Status.jsx';

function initialValues(donation) {
  if (!donation) return { donor_name: '', amount: '', date: todayISO(), purpose: '' };
  return {
    donor_name: donation.donor_name,
    amount: String(donation.amount),
    date: donation.date,
    purpose: donation.purpose,
  };
}

export default function DonationForm({ donation, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => initialValues(donation));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(donation);

  const update = (field) => (event) => setValues({ ...values, [field]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    const validationErrors = validateDonation(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        donor_name: values.donor_name.trim(),
        amount: Number(values.amount),
        date: values.date,
        purpose: values.purpose.trim(),
      });
      if (!isEdit) setValues(initialValues(null));
    } catch (err) {
      setErrors(err.fieldErrors ?? {});
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2>{isEdit ? 'Edit donation' : 'Add donation'}</h2>
      {formError && <ErrorMessage message={formError} />}
      <div className="form-grid">
        <Field id="donor_name" label="Donor name" error={errors.donor_name}>
          <input
            id="donor_name"
            value={values.donor_name}
            onChange={update('donor_name')}
            maxLength={200}
            aria-invalid={Boolean(errors.donor_name)}
          />
        </Field>
        <Field id="amount" label="Amount (₹)" error={errors.amount}>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={values.amount}
            onChange={update('amount')}
            aria-invalid={Boolean(errors.amount)}
          />
        </Field>
        <Field id="date" label="Date" error={errors.date}>
          <input
            id="date"
            type="date"
            value={values.date}
            onChange={update('date')}
            aria-invalid={Boolean(errors.date)}
          />
        </Field>
        <Field id="purpose" label="Purpose" error={errors.purpose}>
          <input
            id="purpose"
            value={values.purpose}
            onChange={update('purpose')}
            maxLength={1000}
            placeholder="Optional"
          />
        </Field>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add donation'}
        </button>
        {onCancel && (
          <button type="button" className="btn" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
