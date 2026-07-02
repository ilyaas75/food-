import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import AdminRowActions from '../../components/admin/AdminRowActions';

const STATUSES = ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled'];
const PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refunded'];

const emptyForm = {
  customerId: '',
  restaurantId: '',
  foodItemId: '',
  quantity: 1,
  status: 'pending',
  paymentStatus: 'pending',
  totalAmount: '',
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'Somalia',
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [orderList, userList, restaurantList, foodList] = await Promise.all([
        api.getOrders(),
        api.getUsers(),
        api.getRestaurants(),
        api.getFoodItems(),
      ]);
      setOrders(orderList);
      setUsers(userList);
      setRestaurants(restaurantList);
      setFoodItems(foodList);
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

  const selectedRestaurantFood = form.restaurantId
    ? foodItems.filter((item) => (item.restaurantId?._id || item.restaurantId) === form.restaurantId)
    : foodItems;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    const deliveryAddress = {
      street: form.street,
      city: form.city,
      state: form.state,
      zipCode: form.zipCode,
      country: form.country,
    };
    try {
      if (editingId) {
        await api.updateOrder(editingId, {
          status: form.status,
          paymentStatus: form.paymentStatus,
          totalAmount: Number(form.totalAmount),
          deliveryAddress,
        });
        setMessage('Order updated');
      } else {
        await api.createOrder({
          customerId: form.customerId,
          restaurantId: form.restaurantId,
          items: [{ foodItemId: form.foodItemId, quantity: Number(form.quantity) }],
          status: form.status,
          paymentStatus: form.paymentStatus,
          deliveryAddress,
        });
        setMessage('Order created');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (order) => {
    const address = order.deliveryAddress || {};
    setEditingId(order._id);
    setForm({
      customerId: order.customerId?._id || order.customerId || '',
      restaurantId: order.restaurantId?._id || order.restaurantId || '',
      foodItemId: order.items?.[0]?.foodItemId?._id || order.items?.[0]?.foodItemId || '',
      quantity: order.items?.[0]?.quantity || 1,
      status: order.status || 'pending',
      paymentStatus: order.paymentStatus || 'pending',
      totalAmount: String(order.totalAmount ?? ''),
      street: address.street || '',
      city: address.city || '',
      state: address.state || '',
      zipCode: address.zipCode || '',
      country: address.country || 'Somalia',
    });
    setError('');
    setMessage('');
  };

  const handleDelete = async (orderId) => {
    if (!confirm('Delete this order permanently?')) return;
    setMessage('');
    try {
      await api.deleteOrder(orderId);
      setMessage('Order deleted');
      if (editingId === orderId) resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="page-loading">Loading orders...</div>;

  return (
    <div>
      <h1>Orders</h1>
      <p className="muted">Full CRUD for customer orders</p>
      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      {editingId && (
        <div className="admin-edit-banner">
          <span>Editing order #{editingId.slice(-6)}</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={resetForm}>Cancel edit</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form-card admin-form-card-wide">
        <h2>{editingId ? 'Update order' : 'Create order'}</h2>
        {!editingId && (
          <>
            <select
              value={form.customerId}
              onChange={(e) => setForm({ ...form, customerId: e.target.value })}
              required
            >
              <option value="">Select customer</option>
              {users.filter((u) => u.role === 'customer').map((u) => (
                <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
              ))}
            </select>
            <select
              value={form.restaurantId}
              onChange={(e) => setForm({ ...form, restaurantId: e.target.value, foodItemId: '' })}
              required
            >
              <option value="">Select restaurant</option>
              {restaurants.map((r) => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
            <select
              value={form.foodItemId}
              onChange={(e) => setForm({ ...form, foodItemId: e.target.value })}
              required
            >
              <option value="">Select food item</option>
              {selectedRestaurantFood.map((item) => (
                <option key={item._id} value={item._id}>{item.name} (${item.price?.toFixed(2)})</option>
              ))}
            </select>
            <input
              type="number"
              min="1"
              placeholder="Quantity"
              value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: e.target.value })}
              required
            />
          </>
        )}
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })}>
          {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {editingId && (
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Total amount"
            value={form.totalAmount}
            onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
            required
          />
        )}
        <input placeholder="Street" value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} required />
        <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
        <input placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} required />
        <input placeholder="Zip code" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} required />
        <input placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary">{editingId ? 'Save changes' : 'Create order'}</button>
          {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Restaurant</th>
              <th>Total</th>
              <th>Current</th>
              <th>Payment</th>
              <th>Date</th>
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
                <td>{order.paymentStatus || 'pending'}</td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td>
                  <AdminRowActions
                    onEdit={() => startEdit(order)}
                    onDelete={() => handleDelete(order._id)}
                    deleteLabel="Delete"
                  />
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
