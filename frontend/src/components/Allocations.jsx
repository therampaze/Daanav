import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatDate, formatINR } from '../format.js';
import AllocationForm from './AllocationForm.jsx';
import { Empty, ErrorMessage, Loading } from './Status.jsx';

export default function Allocations() {
  const [allocations, setAllocations] = useState(null);
  const [balance, setBalance] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [list, totals] = await Promise.all([api.listAllocations(), api.getDashboard()]);
      setAllocations(list);
      setBalance(totals.remaining_balance);
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(values) {
    await api.createAllocation(values);
    setNotice('Funds allocated.');
    setActionError(null);
    await load();
  }

  async function handleDelete(allocation) {
    const confirmed = window.confirm(
      `Delete the allocation of ${formatINR(allocation.amount)} to ${allocation.cause_name}?`,
    );
    if (!confirmed) return;
    setNotice(null);
    try {
      await api.deleteAllocation(allocation.id);
      setActionError(null);
      setNotice('Allocation deleted.');
      await load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <section>
      <h1>Allocations</h1>
      <AllocationForm availableBalance={balance} onSubmit={handleCreate} />
      {notice && (
        <p className="alert alert-success" role="status">
          {notice}
        </p>
      )}
      {actionError && <ErrorMessage message={actionError} />}

      <h2>All allocations</h2>
      {loadError && <ErrorMessage message={loadError} onRetry={load} />}
      {!loadError && !allocations && <Loading />}
      {allocations && allocations.length === 0 && <Empty>No allocations yet.</Empty>}
      {allocations && allocations.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Cause</th>
                <th>Description</th>
                <th className="num">Amount</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allocations.map((allocation) => (
                <tr key={allocation.id}>
                  <td>{formatDate(allocation.created_at)}</td>
                  <td>{allocation.cause_name}</td>
                  <td>{allocation.description || '—'}</td>
                  <td className="num">{formatINR(allocation.amount)}</td>
                  <td className="actions">
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(allocation)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
