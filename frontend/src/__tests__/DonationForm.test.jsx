import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import DonationForm from '../components/DonationForm.jsx';
import { ApiError } from '../api.js';

describe('DonationForm', () => {
  it('shows validation messages and does not submit invalid input', () => {
    const onSubmit = vi.fn();
    render(<DonationForm onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Add donation' }));

    expect(screen.getByText('Donor name must not be empty.')).toBeInTheDocument();
    expect(screen.getByText('Amount is required.')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits a trimmed payload with a numeric amount', async () => {
    const onSubmit = vi.fn().mockResolvedValue();
    render(<DonationForm onSubmit={onSubmit} />);

    fireEvent.change(screen.getByLabelText('Donor name'), { target: { value: '  Asha  ' } });
    fireEvent.change(screen.getByLabelText('Amount (₹)'), { target: { value: '250.75' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-05-01' } });
    fireEvent.change(screen.getByLabelText('Purpose'), { target: { value: 'Books' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add donation' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        donor_name: 'Asha',
        amount: 250.75,
        date: '2024-05-01',
        purpose: 'Books',
      }),
    );
  });

  it('shows server errors', async () => {
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError('Amount must be greater than zero.', 422, { amount: 'Too low.' }));
    render(<DonationForm donation={{ id: 1, donor_name: 'Asha', amount: 5, date: '2024-05-01', purpose: '' }} onSubmit={onSubmit} />);

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Amount must be greater than zero.');
    expect(screen.getByText('Too low.')).toBeInTheDocument();
  });
});
