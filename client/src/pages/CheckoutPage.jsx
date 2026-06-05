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

export default function CheckoutPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [address, setAddress] = useState(emptyAddress);
  const [paymentMethod, setPaymentMethod] = useState('cash_on_delivery');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

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
    setSubmitting(true);
    try {
      const order = await api.checkout({
        deliveryAddress: address,
        paymentMethod,
      });
      navigate(`/orders/${order._id}`);
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
              { value: 'cash_on_delivery', label: 'Cash on delivery' },
              { value: 'credit_card', label: 'Credit card' },
              { value: 'paypal', label: 'PayPal' },
            ].map((opt) => (
              <label key={opt.value} className="payment-option">
                <input
                  type="radio"
                  name="payment"
                  value={opt.value}
                  checked={paymentMethod === opt.value}
                  onChange={() => setPaymentMethod(opt.value)}
                />
                {opt.label}
              </label>
            ))}
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Placing order...' : `Place order · $${total.toFixed(2)}`}
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
          <div className="summary-row total">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
