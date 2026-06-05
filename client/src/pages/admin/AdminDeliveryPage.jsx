import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import AdminRowActions from '../../components/admin/AdminRowActions';

const emptyForm = {
  orderId: '',
  deliveryStaffId: '',
  status: 'assigned',
  vehicleDetails: '',
};

const STATUSES = ['assigned', 'picked-up', 'delivered'];

export default function AdminDeliveryPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [d, o, u] = await Promise.all([
        api.getDeliveries(),
        api.getOrders(),
        api.getUsers(),
      ]);
      setDeliveries(d);
      setOrders(o);
      setUsers(u);
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
      status: form.status,
      vehicleDetails: form.vehicleDetails || undefined,
    };
    if (form.deliveryStaffId) body.deliveryStaffId = form.deliveryStaffId;
    try {
      if (editingId) {
        await api.updateDelivery(editingId, body);
        setMessage('Delivery updated');
      } else {
        await api.createDelivery(body);
        setMessage('Delivery created');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (d) => {
    setEditingId(d._id);
    setForm({
      orderId: d.orderId?._id || d.orderId || '',
      deliveryStaffId: d.deliveryStaffId?._id || d.deliveryStaffId || '',
      status: d.status || 'assigned',
      vehicleDetails: d.vehicleDetails || '',
    });
    setMessage('');
    setError('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this delivery record?')) return;
    try {
      await api.deleteDelivery(id);
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <h1>Deliveries</h1>
      <p className="muted">Assign and manage order deliveries</p>
      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      {editingId && (
        <div className="admin-edit-banner">
          <span>Editing delivery</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={resetForm}>Cancel edit</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form-card admin-form-card-wide">
        <h2>{editingId ? 'Update delivery' : 'Create delivery'}</h2>
        <select
          value={form.orderId}
          onChange={(e) => setForm({ ...form, orderId: e.target.value })}
          required
        >
          <option value="">Select order</option>
          {orders.map((o) => (
            <option key={o._id} value={o._id}>
              {o._id.slice(-6)} — {o.status}
            </option>
          ))}
        </select>
        <select
          value={form.deliveryStaffId}
          onChange={(e) => setForm({ ...form, deliveryStaffId: e.target.value })}
        >
          <option value="">Staff (optional — defaults to you)</option>
          {users.map((u) => (
            <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
          ))}
        </select>
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input
          placeholder="Vehicle details"
          value={form.vehicleDetails}
          onChange={(e) => setForm({ ...form, vehicleDetails: e.target.value })}
        />
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary">{editingId ? 'Save changes' : 'Create delivery'}</button>
          {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Staff</th>
              <th>Status</th>
              <th>Vehicle</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((d) => (
              <tr key={d._id}>
                <td>{d.orderId?._id?.slice(-6) || d.orderId}</td>
                <td>{d.deliveryStaffId?.name || '—'}</td>
                <td>{d.status}</td>
                <td>{d.vehicleDetails || '—'}</td>
                <td>
                  <AdminRowActions onEdit={() => startEdit(d)} onDelete={() => handleDelete(d._id)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {deliveries.length === 0 && <p className="muted">No deliveries yet.</p>}
      </div>
    </div>
  );
}
