import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Dashboard from '../components/Dashboard.jsx';

function mockFetch(impl) {
  vi.stubGlobal('fetch', vi.fn(impl));
}

afterEach(() => vi.unstubAllGlobals());

describe('Dashboard', () => {
  it('renders totals from the API', async () => {
    mockFetch(async () => ({
      ok: true,
      status: 200,
      json: async () => ({
        total_donations: 1500,
        donation_count: 2,
        total_allocated: 400,
        remaining_balance: 1100,
      }),
    }));
    render(<Dashboard />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading');
    expect(await screen.findByText('₹1,500.00')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('₹400.00')).toBeInTheDocument();
    expect(screen.getByText('₹1,100.00')).toBeInTheDocument();
  });

  it('shows an error when the backend is unreachable', async () => {
    mockFetch(async () => {
      throw new TypeError('Failed to fetch');
    });
    render(<Dashboard />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Cannot reach the server');
  });
});
