import { useState } from 'react';
import { formatINR } from '../format.js';
import { validateAllocation } from '../validation.js';
import Field from './Field.jsx';
import { ErrorMessage } from './Status.jsx';

const EMPTY = { cause_name: '', amount: '', description: '' };

export default function AllocationForm({ availableBalance, onSubmit }) {
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const update = (field) => (event) => setValues({ ...values, [field]: event.target.value });

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError(null);
    const validationErrors = validateAllocation(values, availableBalance);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) return;

    setSubmitting(true);
    try {
      await onSubmit({
        cause_name: values.cause_name.trim(),
        amount: Number(values.amount),
        description: values.description.trim(),
      });
      setValues(EMPTY);
    } catch (err) {
      setErrors(err.fieldErrors ?? {});
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <h2>Allocate funds</h2>
      {availableBalance != null && (
        <p className="muted">Available balance: {formatINR(availableBalance)}</p>
      )}
      {formError && <ErrorMessage message={formError} />}
      <div className="form-grid">
        <Field id="cause_name" label="Cause name" error={errors.cause_name}>
          <input
            id="cause_name"
            value={values.cause_name}
            onChange={update('cause_name')}
            maxLength={200}
            aria-invalid={Boolean(errors.cause_name)}
          />
        </Field>
        <Field id="allocation_amount" label="Amount (₹)" error={errors.amount}>
          <input
            id="allocation_amount"
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={values.amount}
            onChange={update('amount')}
            aria-invalid={Boolean(errors.amount)}
          />
        </Field>
        <Field id="description" label="Description" error={errors.description}>
          <input
            id="description"
            value={values.description}
            onChange={update('description')}
            maxLength={1000}
            placeholder="Optional"
          />
        </Field>
      </div>
      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={submitting}>
          {submitting ? 'Saving…' : 'Allocate'}
        </button>
      </div>
    </form>
  );
}
