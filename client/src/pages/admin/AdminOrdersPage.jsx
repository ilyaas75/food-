import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import AdminRowActions from '../../components/admin/AdminRowActions';

const STATUSES = ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadOrders = () => {
    setLoading(true);
    api.getOrders()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId, status) => {
    setMessage('');
    try {
      await api.updateOrderStatus(orderId, { status });
      setMessage('Order status updated');
      loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (orderId) => {
    if (!confirm('Delete this order permanently?')) return;
    setMessage('');
    try {
      await api.deleteOrder(orderId);
      setMessage('Order deleted');
      loadOrders();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="page-loading">Loading orders...</div>;

  return (
    <div>
      <h1>Orders</h1>
      <p className="muted">All customer orders — update status as admin</p>
      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Restaurant</th>
              <th>Total</th>
              <th>Current</th>
              <th>Date</th>
              <th>Update</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order._id}>
                <td>{order.customerId?.name || '—'}</td>
                <td>{order.restaurantId?.name || '—'}</td>
                <td>${order.totalAmount?.toFixed(2)}</td>
                <td>
                  <span className="status-badge">{order.status}</span>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  <select
                    value={order.status}
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className="admin-select"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <AdminRowActions onDelete={() => handleDelete(order._id)} deleteLabel="Delete" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="muted">No orders yet.</p>}
      </div>
    </div>
  );
}
