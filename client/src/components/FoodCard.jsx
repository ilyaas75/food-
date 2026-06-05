import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function FoodCard({ item, onAdd }) {
  const { isAuthenticated, isCustomer } = useAuth();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const handleAdd = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setAdding(true);
    try {
      await onAdd(item._id);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="food-card">
      <div
        className="food-card-image"
        style={{ backgroundImage: item.image ? `url(${item.image})` : undefined }}
      />
      <div className="food-card-body">
        <div className="food-card-header">
          <h3>{item.name}</h3>
          <span className="price">${item.price.toFixed(2)}</span>
        </div>
        <p>{item.description}</p>
        {isCustomer ? (
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={handleAdd}
            disabled={adding || !item.isAvailable}
          >
            {adding ? 'Adding...' : item.isAvailable ? 'Add to cart' : 'Unavailable'}
          </button>
        ) : (
          <p className="muted" style={{ fontSize: '0.85rem', margin: 0 }}>
            {isAuthenticated ? 'Admins manage menu from the dashboard' : 'Login as customer to order'}
          </p>
        )}
      </div>
    </article>
  );
}
