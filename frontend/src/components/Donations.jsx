import { useCallback, useEffect, useState } from 'react';
import { api } from '../api.js';
import { formatDate, formatINR } from '../format.js';
import DonationForm from './DonationForm.jsx';
import { Empty, ErrorMessage, Loading } from './Status.jsx';

export default function Donations() {
  const [donations, setDonations] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      setDonations(await api.listDonations());
    } catch (err) {
      setLoadError(err.message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(values) {
    await api.createDonation(values);
    setNotice('Donation added.');
    setActionError(null);
    await load();
  }

  async function handleUpdate(values) {
    await api.updateDonation(editing.id, values);
    setEditing(null);
    setNotice('Donation updated.');
    setActionError(null);
    await load();
  }

  async function handleDelete(donation) {
    const confirmed = window.confirm(
      `Delete the donation of ${formatINR(donation.amount)} from ${donation.donor_name}?`,
    );
    if (!confirmed) return;
    setNotice(null);
    try {
      await api.deleteDonation(donation.id);
      if (editing?.id === donation.id) setEditing(null);
      setActionError(null);
      setNotice('Donation deleted.');
      await load();
    } catch (err) {
      setActionError(err.message);
    }
  }

  return (
    <section>
      <h1>Donations</h1>
      <DonationForm
        key={editing?.id ?? 'new'}
        donation={editing}
        onSubmit={editing ? handleUpdate : handleCreate}
        onCancel={editing ? () => setEditing(null) : undefined}
      />
      {notice && (
        <p className="alert alert-success" role="status">
          {notice}
        </p>
      )}
      {actionError && <ErrorMessage message={actionError} />}

      <h2>All donations</h2>
      {loadError && <ErrorMessage message={loadError} onRetry={load} />}
      {!loadError && !donations && <Loading />}
      {donations && donations.length === 0 && <Empty>No donations yet.</Empty>}
      {donations && donations.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Donor</th>
                <th>Purpose</th>
                <th className="num">Amount</th>
                <th className="actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {donations.map((donation) => (
                <tr key={donation.id}>
                  <td>{formatDate(donation.date)}</td>
                  <td>{donation.donor_name}</td>
                  <td>{donation.purpose || '—'}</td>
                  <td className="num">{formatINR(donation.amount)}</td>
                  <td className="actions">
                    <button
                      type="button"
                      className="btn btn-small"
                      onClick={() => {
                        setNotice(null);
                        setEditing(donation);
                        window.scrollTo({ top: 0 });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-small btn-danger"
                      onClick={() => handleDelete(donation)}
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
