import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.getOrder(id), api.getMyPayments()])
      .then(([orderData, paymentList]) => {
        setOrder(orderData);
        setPayment(paymentList.find((p) => (p.orderId?._id || p.orderId) === orderData._id) || null);
      })
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
          {order.paymentStatus && (
            <> · Payment: <strong>{order.paymentStatus}</strong></>
          )}
        </div>

        {order.referenceId && (
          <p className="muted">Reference: {order.referenceId}</p>
        )}

        <section className="payment-confirmation-card">
          <div>
            <p className="payment-confirmation-label">Payment confirmation</p>
            <h2>{payment?.paymentMethod?.replaceAll('_', ' ') || 'Payment'}</h2>
          </div>
          <div className="payment-confirmation-grid">
            <div>
              <span>Status</span>
              <strong>{payment?.status || order.paymentStatus || 'pending'}</strong>
            </div>
            <div>
              <span>Verification</span>
              <strong>{payment?.verificationStatus || 'not_required'}</strong>
            </div>
            <div>
              <span>Amount</span>
              <strong>${(payment?.amount || order.totalAmount).toFixed(2)}</strong>
            </div>
            <div>
              <span>Transaction / Reference</span>
              <strong>{payment?.transactionId || payment?.offlineDetails?.transferReference || order.referenceId || '—'}</strong>
            </div>
          </div>
          {payment?.verificationStatus === 'pending' && (
            <p className="muted payment-confirmation-note">
              Your payment was received and is waiting for admin verification.
            </p>
          )}
          {payment?.verificationStatus === 'verified' && (
            <p className="success-text payment-confirmation-note">
              Payment verified. Your order is confirmed.
            </p>
          )}
          {payment?.verificationStatus === 'rejected' && (
            <p className="error-text payment-confirmation-note">
              Payment rejected. Please contact support or place a new order.
            </p>
          )}
        </section>

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
