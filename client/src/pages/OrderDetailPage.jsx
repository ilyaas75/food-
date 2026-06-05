import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getOrder(id)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="page-loading">Loading order...</div>;
  if (error) return <div className="container section"><p className="error-text">{error}</p></div>;
  if (!order) return null;

  const address = order.deliveryAddress;

  return (
    <div className="section">
      <div className="container order-detail">
        <Link to="/orders" className="back-link">← Back to orders</Link>
        <h1>Order #{order._id.slice(-6)}</h1>
        <p className="muted">
          {order.restaurantId?.name} · {new Date(order.createdAt).toLocaleString()}
        </p>

        <div className="order-status-banner">
          Status: <strong>{order.status}</strong>
        </div>

        <h2>Items</h2>
        <ul className="checkout-items">
          {order.items.map((item) => (
            <li key={item._id}>
              <span>
                {item.foodItemId?.name || 'Item'} × {item.quantity}
              </span>
              <span>${(item.price * item.quantity).toFixed(2)}</span>
            </li>
          ))}
        </ul>

        <div className="summary-row total">
          <span>Total</span>
          <span>${order.totalAmount.toFixed(2)}</span>
        </div>

        {address && (
          <>
            <h2>Delivery address</h2>
            <p className="address-block">
              {address.street}, {address.city}, {address.state} {address.zipCode}, {address.country}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
