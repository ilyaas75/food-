import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import AdminRowActions from '../../components/admin/AdminRowActions';

export default function AdminCartsPage() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    api.getAllCarts().then(setCarts).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (customerId) => {
    if (!confirm('Delete this customer cart?')) return;
    try {
      await api.deleteCart(customerId);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <h1>Customer carts</h1>
      <p className="muted">Read all carts and delete stale carts (admin)</p>
      {error && <p className="error-text">{error}</p>}

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Items</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {carts.map((cart) => (
              <tr key={cart._id}>
                <td>
                  {cart.customerId?.name || '—'}
                  <br />
                  <span className="muted">{cart.customerId?.email}</span>
                </td>
                <td>
                  {cart.items?.length === 0 ? (
                    <span className="muted">Empty</span>
                  ) : (
                    <ul className="cart-items-inline">
                      {cart.items.map((item, i) => (
                        <li key={i}>
                          {item.foodItemId?.name || 'Item'} × {item.quantity}
                        </li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>{new Date(cart.updatedAt).toLocaleString()}</td>
                <td>
                  <AdminRowActions
                    onDelete={() => handleDelete(cart.customerId?._id || cart.customerId)}
                    deleteLabel="Clear cart"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {carts.length === 0 && <p className="muted">No carts in the database.</p>}
      </div>
    </div>
  );
}
