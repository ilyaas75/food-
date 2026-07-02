import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import AdminRowActions from '../../components/admin/AdminRowActions';

const emptyForm = {
  orderId: '',
  paymentMethod: 'credit_card',
  amount: '',
  status: 'pending',
  verificationStatus: 'not_required',
  bankName: '',
  accountName: '',
  transferReference: '',
  proofUrl: '',
  notes: '',
};

const METHODS = ['waafi', 'bank_transfer', 'cash_on_delivery', 'credit_card', 'paypal'];
const STATUSES = ['pending', 'completed', 'failed', 'approved', 'refunded'];
const VERIFICATION_STATUSES = ['not_required', 'pending', 'verified', 'rejected'];
const OFFLINE_METHODS = ['cash_on_delivery', 'cash', 'bank_transfer'];

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [p, o] = await Promise.all([api.getPayments(), api.getOrders()]);
      setPayments(p);
      setOrders(o);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const body = {
      orderId: form.orderId,
      paymentMethod: form.paymentMethod,
      amount: Number(form.amount),
      status: form.status,
      verificationStatus: form.verificationStatus,
      offlineDetails: {
        bankName: form.bankName,
        accountName: form.accountName,
        transferReference: form.transferReference,
        proofUrl: form.proofUrl,
        notes: form.notes,
      },
    };
    try {
      if (editingId) {
        await api.updatePayment(editingId, body);
        setMessage('Payment updated');
      } else {
        await api.createPayment(body);
        setMessage('Payment created');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (p) => {
    setEditingId(p._id);
    setForm({
      orderId: p.orderId?._id || p.orderId || '',
      paymentMethod: p.paymentMethod || 'credit_card',
      amount: String(p.amount ?? ''),
      status: p.status || 'pending',
      verificationStatus: p.verificationStatus || 'not_required',
      bankName: p.offlineDetails?.bankName || '',
      accountName: p.offlineDetails?.accountName || '',
      transferReference: p.offlineDetails?.transferReference || '',
      proofUrl: p.offlineDetails?.proofUrl || '',
      notes: p.offlineDetails?.notes || '',
    });
    setMessage('');
    setError('');
  };

  const handleRefund = async (id) => {
    if (!confirm('Refund this WaafiPay payment via API_REVERSAL?')) return;
    try {
      await api.refundPayment(id);
      setMessage('Payment refunded');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this payment record?')) return;
    try {
      await api.deletePayment(id);
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleVerify = async (id, verificationStatus) => {
    const action = verificationStatus === 'verified' ? 'verify' : 'reject';
    const verificationNote = prompt(`Optional note for ${action} action`) || '';
    try {
      await api.verifyPayment(id, { verificationStatus, verificationNote });
      setMessage(verificationStatus === 'verified' ? 'Offline payment verified' : 'Offline payment rejected');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <h1>Payments</h1>
      <p className="muted">Create, read, update, and delete payment records</p>
      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      {editingId && (
        <div className="admin-edit-banner">
          <span>Editing payment</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={resetForm}>Cancel edit</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form-card admin-form-card-wide">
        <h2>{editingId ? 'Update payment' : 'Create payment'}</h2>
        <select
          value={form.orderId}
          onChange={(e) => setForm({ ...form, orderId: e.target.value })}
          required
        >
          <option value="">Select order</option>
          {orders.map((o) => (
            <option key={o._id} value={o._id}>
              {o._id.slice(-6)} — {o.customerId?.name || 'Customer'} (${o.totalAmount?.toFixed(2)})
            </option>
          ))}
        </select>
        <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
          {METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="Amount"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={form.verificationStatus}
          onChange={(e) => setForm({ ...form, verificationStatus: e.target.value })}
        >
          {VERIFICATION_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {OFFLINE_METHODS.includes(form.paymentMethod) && (
          <>
            <input
              placeholder="Bank name"
              value={form.bankName}
              onChange={(e) => setForm({ ...form, bankName: e.target.value })}
            />
            <input
              placeholder="Account name"
              value={form.accountName}
              onChange={(e) => setForm({ ...form, accountName: e.target.value })}
            />
            <input
              placeholder="Transfer reference"
              value={form.transferReference}
              onChange={(e) => setForm({ ...form, transferReference: e.target.value })}
            />
            <input
              placeholder="Proof URL"
              value={form.proofUrl}
              onChange={(e) => setForm({ ...form, proofUrl: e.target.value })}
            />
            <input
              placeholder="Offline notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </>
        )}
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary">{editingId ? 'Save changes' : 'Create payment'}</button>
          {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Transaction</th>
              <th>Order</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Verification</th>
              <th>Tracking</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((p) => (
              <tr key={p._id}>
                <td>{p.referenceId || '—'}</td>
                <td>{p.transactionId || '—'}</td>
                <td>{p.orderId?._id?.slice(-6) || p.orderId}</td>
                <td>{p.paymentMethod}</td>
                <td>${p.amount?.toFixed(2)}</td>
                <td>{p.status}</td>
                <td>{p.verificationStatus || 'not_required'}</td>
                <td>
                  {p.offlineDetails?.transferReference || p.offlineDetails?.notes || '—'}
                  {p.offlineDetails?.proofUrl && (
                    <>
                      <br />
                      <a href={p.offlineDetails.proofUrl} target="_blank" rel="noreferrer">Proof</a>
                    </>
                  )}
                </td>
                <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                <td>
                  <AdminRowActions
                    onEdit={() => startEdit(p)}
                    onDelete={() => handleDelete(p._id)}
                  />
                  {p.transactionId && p.status === 'approved' && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => handleRefund(p._id)}
                    >
                      Refund
                    </button>
                  )}
                  {OFFLINE_METHODS.includes(p.paymentMethod) && p.verificationStatus === 'pending' && (
                    <div className="admin-row-actions">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleVerify(p._id, 'verified')}
                      >
                        Verify
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm btn-danger"
                        onClick={() => handleVerify(p._id, 'rejected')}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {payments.length === 0 && <p className="muted">No payments yet.</p>}
      </div>
    </div>
  );
}
