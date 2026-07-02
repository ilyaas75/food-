import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const statusColors = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  preparing: '#8b5cf6',
  'out-for-delivery': '#06b6d4',
  delivered: '#22c55e',
  cancelled: '#ef4444',
};

export default function OrdersPage() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [payments, setPayments] = useState([]);
  const [firstRestaurantId, setFirstRestaurantId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAdmin) {
      navigate('/admin/orders', { replace: true });
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    Promise.all([api.getOrders(), api.getMyPayments()])
      .then(([orderList, paymentList]) => {
        setOrders(orderList);
        setPayments(paymentList);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.getRestaurants()
      .then((list) => {
        if (list.length > 0) setFirstRestaurantId(list[0]._id);
      })
      .catch(() => {});
  }, []);

  if (isAdmin) return null;

  if (loading) return <div className="page-loading">Loading orders...</div>;

  const orderNowTo = firstRestaurantId
    ? `/restaurants/${firstRestaurantId}`
    : '/#restaurants';

  const paymentByOrder = payments.reduce((acc, payment) => {
    const orderId = payment.orderId?._id || payment.orderId;
    acc[orderId] = payment;
    return acc;
  }, {});

  return (
    <div className="section">
      <div className="container">
        <h1>Your orders</h1>
        {error && <p className="error-text">{error}</p>}

        {orders.length === 0 ? (
          <div className="empty-state">
            <p>No orders yet.</p>
            <p className="muted">Pick a restaurant, add items to your cart, then checkout.</p>
            <Link to={orderNowTo} className="btn btn-primary">
              Order now
            </Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map((order) => (
              (() => {
                const payment = paymentByOrder[order._id];
                return (
                  <Link key={order._id} to={`/orders/${order._id}`} className="order-card">
                    <div>
                      <h3>{order.restaurantId?.name || 'Restaurant'}</h3>
                      <p className="muted">
                        {new Date(order.createdAt).toLocaleString()} · {order.items.length} items
                      </p>
                      <div className="payment-history-line">
                        <span>{payment?.paymentMethod?.replaceAll('_', ' ') || 'payment'}</span>
                        <span>Payment: {order.paymentStatus || payment?.status || 'pending'}</span>
                        {payment?.verificationStatus && payment.verificationStatus !== 'not_required' && (
                          <span>Verification: {payment.verificationStatus}</span>
                        )}
                      </div>
                    </div>
                    <div className="order-card-right">
                      <span
                        className="status-badge"
                        style={{ backgroundColor: statusColors[order.status] || '#64748b' }}
                      >
                        {order.status}
                      </span>
                      <span className="price">${order.totalAmount.toFixed(2)}</span>
                    </div>
                  </Link>
                );
              })()
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
