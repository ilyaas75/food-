import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

const emptyAddress = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'Somalia',
};

const SANDBOX_WALLETS = [
  { label: 'EVCPlus (Hormuud)', number: '252611111111', pin: '1212' },
  { label: 'ZAAD (Telesom)', number: '252631111111', pin: '1212' },
  { label: 'SAHAL (Golis)', number: '252901111111', pin: '1212' },
  { label: 'WAAFI Djibouti', number: '25377111111', pin: '1212' },
  { label: 'WAAFI International', number: '9715111111111', pin: '1212' },
];

const emptyOfflineDetails = {
  bankName: '',
  accountName: '',
  transferReference: '',
  proofUrl: '',
  notes: '',
};

export default function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [address, setAddress] = useState(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [waafiConfigured, setWaafiConfigured] = useState(false);
  const [waafiMode, setWaafiMode] = useState('disabled');
  const [accountNo, setAccountNo] = useState('');
  const [offlineDetails, setOfflineDetails] = useState(emptyOfflineDetails);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    api.getProfile()
      .then((profile) => {
        if (profile.addresses?.[0]) {
          setAddress({ ...emptyAddress, ...profile.addresses[0] });
        }
      })
      .catch(() => {});

    api.getCart()
      .then(setCart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    api.getPaymentConfig()
      .then((config) => {
        setWaafiConfigured(!!config.waafiConfigured);
        setWaafiMode(config.waafiMode || 'disabled');
        if (config.waafiConfigured) {
          setPaymentMethod('waafi');
        }
      })
      .catch(() => {
        setWaafiConfigured(false);
        setWaafiMode('disabled');
        setPaymentMethod('cash_on_delivery');
      });
  }, []);

  const items = cart?.items || [];
  const subtotal = items.reduce((sum, item) => {
    const food = item.foodItemId;
    return sum + (food?.price || 0) * item.quantity;
  }, 0);
  const deliveryFee = items.length ? 2.99 : 0;
  const total = subtotal + deliveryFee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setSubmitting(true);
    try {
      const payload = {
        deliveryAddress: address,
        paymentMethod,
      };
      if (paymentMethod === 'waafi') {
        payload.accountNo = accountNo.replace(/\s+/g, '');
      }
      if (paymentMethod === 'bank_transfer' || paymentMethod === 'cash_on_delivery') {
        payload.offlineDetails = offlineDetails;
      }

      const order = await api.checkout(payload);

      if (paymentMethod === 'waafi') {
        setSuccessMessage(`Payment successful — order ${order.referenceId || order._id.slice(-6)}`);
        setTimeout(() => navigate(`/orders/${order._id}`), 1200);
      } else if (paymentMethod === 'bank_transfer' || paymentMethod === 'cash_on_delivery') {
        setSuccessMessage(`Order placed — payment pending admin verification (${order.referenceId || order._id.slice(-6)})`);
        setTimeout(() => navigate(`/orders/${order._id}`), 1200);
      } else {
        navigate(`/orders/${order._id}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="page-loading">Loading checkout...</div>;

  if (!items.length) {
    return (
      <div className="section container">
        <div className="empty-state">
          <p>Your cart is empty.</p>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/')}>
            Browse restaurants
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="section">
      <div className="container checkout-layout">
        <form onSubmit={handleSubmit} className="checkout-form">
          <h1>Checkout</h1>
          <p className="muted">Ordering as {user?.name}</p>

          {error && <p className="error-text">{error}</p>}
          {successMessage && <p className="success-text">{successMessage}</p>}

          <h2>Delivery address</h2>
          <div className="form-grid">
            <label>
              Street
              <input
                value={address.street}
                onChange={(e) => setAddress({ ...address, street: e.target.value })}
                required
              />
            </label>
            <label>
              City
              <input
                value={address.city}
                onChange={(e) => setAddress({ ...address, city: e.target.value })}
                required
              />
            </label>
            <label>
              State
              <input
                value={address.state}
                onChange={(e) => setAddress({ ...address, state: e.target.value })}
                required
              />
            </label>
            <label>
              Zip code
              <input
                value={address.zipCode}
                onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                required
              />
            </label>
            <label className="full-width">
              Country
              <input
                value={address.country}
                onChange={(e) => setAddress({ ...address, country: e.target.value })}
                required
              />
            </label>
          </div>

          <h2>Payment</h2>
          <div className="payment-options">
            {[
              {
                value: 'waafi',
                title: 'WaafiPay',
                description: waafiConfigured
                  ? waafiMode === 'demo'
                    ? 'Demo mode enabled — payment will be approved for testing'
                    : 'Mobile wallet payment using EVC, ZAAD, or SAHAL'
                  : 'WaafiPay is disabled until .env credentials are added',
                badge: waafiConfigured ? (waafiMode === 'demo' ? 'Demo' : 'Fast') : 'Setup needed',
                disabled: !waafiConfigured,
              },
              {
                value: 'cash_on_delivery',
                title: 'Cash payment',
                description: 'Pay cash when the order arrives, then admin verifies it',
                badge: 'Offline',
              },
              {
                value: 'bank_transfer',
                title: 'Bank transfer',
                description: 'Submit your transfer reference for admin verification',
                badge: 'Tracked',
              },
              {
                value: 'credit_card',
                title: 'Credit card',
                description: 'Demo card payment for testing only',
                badge: 'Demo',
              },
            ].map((opt) => (
              <label
                key={opt.value}
                className={[
                  'payment-option',
                  paymentMethod === opt.value ? 'selected' : '',
                  opt.disabled ? 'disabled' : '',
                ].filter(Boolean).join(' ')}
              >
                <input
                  type="radio"
                  name="payment"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  disabled={opt.disabled}
                  onChange={() => !opt.disabled && setPaymentMethod(opt.value)}
                />
                <span className="payment-radio-dot" aria-hidden />
                <span className="payment-option-text">
                  <strong>{opt.title}</strong>
                  <small>{opt.description}</small>
                </span>
                <span className="payment-option-badge">{opt.badge}</span>
              </label>
            ))}
          </div>

          {paymentMethod === 'waafi' && (
            <div className="waafi-wallet-section">
              <label className="full-width">
                Mobile wallet number
                <input
                  placeholder="252611111111"
                  value={accountNo}
                  onChange={(e) => setAccountNo(e.target.value)}
                  pattern="[0-9]{10,20}"
                  required
                />
              </label>
              <p className="muted waafi-hint">
                International format only — no + sign, no leading zero. Example: <strong>252611111111</strong>
              </p>
              <div className="waafi-sandbox-box">
                <p><strong>Sandbox test wallets</strong> (PIN: 1212 on your phone)</p>
                <ul>
                  {SANDBOX_WALLETS.map((w) => (
                    <li key={w.number}>
                      {w.label}:{' '}
                      <button
                        type="button"
                        className="link-btn"
                        onClick={() => setAccountNo(w.number)}
                      >
                        {w.number}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {paymentMethod === 'bank_transfer' && (
            <div className="offline-payment-section">
              <p className="muted">
                Transfer the exact amount, then enter your bank/reference details. Admin will verify before confirming the order.
              </p>
              <label>
                Bank name
                <input
                  placeholder="e.g. Salaam Bank"
                  value={offlineDetails.bankName}
                  onChange={(e) => setOfflineDetails({ ...offlineDetails, bankName: e.target.value })}
                  required
                />
              </label>
              <label>
                Account name
                <input
                  placeholder="Name used for the transfer"
                  value={offlineDetails.accountName}
                  onChange={(e) => setOfflineDetails({ ...offlineDetails, accountName: e.target.value })}
                />
              </label>
              <label>
                Transfer reference
                <input
                  placeholder="Bank transaction/reference number"
                  value={offlineDetails.transferReference}
                  onChange={(e) => setOfflineDetails({ ...offlineDetails, transferReference: e.target.value })}
                  required
                />
              </label>
              <label>
                Proof URL (optional)
                <input
                  placeholder="Link to receipt screenshot if available"
                  value={offlineDetails.proofUrl}
                  onChange={(e) => setOfflineDetails({ ...offlineDetails, proofUrl: e.target.value })}
                />
              </label>
            </div>
          )}

          {paymentMethod === 'cash_on_delivery' && (
            <div className="offline-payment-section">
              <p className="muted">
                Pay cash when the order arrives. Admin will verify the cash payment before marking it paid.
              </p>
              <label>
                Notes for cashier / delivery staff (optional)
                <input
                  placeholder="Any cash payment note"
                  value={offlineDetails.notes}
                  onChange={(e) => setOfflineDetails({ ...offlineDetails, notes: e.target.value })}
                />
              </label>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={submitting || (paymentMethod === 'waafi' && !accountNo)}
          >
            {submitting
              ? 'Processing payment...'
              : paymentMethod === 'waafi'
                ? `Pay with WaafiPay · $${total.toFixed(2)}`
                : paymentMethod === 'bank_transfer'
                  ? `Submit bank transfer · $${total.toFixed(2)}`
                : `Place order · $${total.toFixed(2)}`}
          </button>
        </form>

        <aside className="cart-summary">
          <h2>Your order</h2>
          <ul className="checkout-items">
            {items.map((item) => {
              const food = item.foodItemId;
              return (
                <li key={food._id}>
                  <span>{food.name} × {item.quantity}</span>
                  <span>${(food.price * item.quantity).toFixed(2)}</span>
                </li>
              );
            })}
          </ul>
          <div className="summary-row">
            <span>Delivery</span>
            <span>${deliveryFee.toFixed(2)}</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
