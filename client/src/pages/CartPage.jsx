import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

export default function CartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadCart = () => {
    setLoading(true);
    api.getCart()
      .then(setCart)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const handleRemove = async (foodItemId) => {
    try {
      const updated = await api.removeFromCart(foodItemId);
      setCart(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClear = async () => {
    try {
      const updated = await api.clearCart();
      setCart(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  const items = cart?.items || [];
  const total = items.reduce((sum, item) => {
    const food = item.foodItemId;
    return sum + (food?.price || 0) * item.quantity;
  }, 0);

  if (loading) return <div className="page-loading">Loading cart...</div>;

  return (
    <div className="section">
      <div className="container cart-layout">
        <div>
          <h1>Your cart</h1>
          {error && <p className="error-text">{error}</p>}

          {items.length === 0 ? (
            <div className="empty-state">
              <p>Your cart is empty.</p>
              <Link to="/" className="btn btn-primary">Browse restaurants</Link>
            </div>
          ) : (
            <ul className="cart-list">
              {items.map((item) => {
                const food = item.foodItemId;
                if (!food?._id) return null;
                return (
                  <li key={food._id} className="cart-item">
                    <div>
                      <h3>{food.name}</h3>
                      <p className="muted">Qty: {item.quantity} · ${food.price.toFixed(2)} each</p>
                    </div>
                    <div className="cart-item-actions">
                      <span className="price">${(food.price * item.quantity).toFixed(2)}</span>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => handleRemove(food._id)}
                      >
                        Remove
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside className="cart-summary">
          <h2>Order summary</h2>
          <div className="summary-row">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="summary-row">
            <span>Delivery</span>
            <span>$2.99</span>
          </div>
          <div className="summary-row total">
            <span>Total</span>
            <span>${(total + (items.length ? 2.99 : 0)).toFixed(2)}</span>
          </div>

          {items.length > 0 && (
            <>
              <Link to="/checkout" className="btn btn-primary btn-block">
                Proceed to checkout
              </Link>
              <button type="button" className="btn btn-outline btn-block" onClick={handleClear}>
                Clear cart
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
