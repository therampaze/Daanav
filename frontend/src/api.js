export class ApiError extends Error {
  constructor(message, status, fieldErrors = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Make sure the backend is running.', 0);
  }

  if (response.status === 204) return null;

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const fieldErrors = {};
    for (const err of data?.errors ?? []) fieldErrors[err.field] = err.message;
    const message =
      typeof data?.detail === 'string' ? data.detail : `Request failed (${response.status}).`;
    throw new ApiError(message, response.status, fieldErrors);
  }
  return data;
}

export const api = {
  getDashboard: () => request('/dashboard'),
  listDonations: () => request('/donations'),
  createDonation: (donation) => request('/donations', { method: 'POST', body: donation }),
  updateDonation: (id, donation) => request(`/donations/${id}`, { method: 'PUT', body: donation }),
  deleteDonation: (id) => request(`/donations/${id}`, { method: 'DELETE' }),
  listAllocations: () => request('/allocations'),
  createAllocation: (allocation) => request('/allocations', { method: 'POST', body: allocation }),
  deleteAllocation: (id) => request(`/allocations/${id}`, { method: 'DELETE' }),
};
