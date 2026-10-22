import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatINR } from '../format.js';
import { Empty, ErrorMessage, Loading } from './Status.jsx';

export default function Dashboard() {
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    setTotals(null);
    try {
      setTotals(await api.getDashboard());
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <h1>Dashboard</h1>
      {error && <ErrorMessage message={error} onRetry={load} />}
      {!error && !totals && <Loading />}
      {totals && (
        <>
          <div className="stats">
            <Stat label="Total donations received" value={formatINR(totals.total_donations)} />
            <Stat label="Donation records" value={totals.donation_count} />
            <Stat label="Total funds allocated" value={formatINR(totals.total_allocated)} />
            <Stat label="Remaining balance" value={formatINR(totals.remaining_balance)} />
          </div>
          {totals.donation_count === 0 && (
            <Empty>
              No donations recorded yet. <a href="#/donations">Add your first donation</a>.
            </Empty>
          )}
        </>
      )}
    </section>
  );
}

function Stat({ label, value }) {
  return (
    <div className="card stat">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </div>
  );
}
