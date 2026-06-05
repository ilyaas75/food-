import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import FoodCard from '../components/FoodCard';

export default function RestaurantPage() {
  const { id } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.getRestaurant(id),
      api.getFoodItems({ restaurantId: id, available: 'true' }),
    ])
      .then(([r, items]) => {
        setRestaurant(r);
        setFoodItems(items);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAdd = async (foodItemId) => {
    setMessage('');
    try {
      await api.addToCart({ foodItemId, quantity: 1 });
      setMessage('Added to cart!');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) return <div className="page-loading">Loading menu...</div>;
  if (error) return <div className="container section"><p className="error-text">{error}</p></div>;
  if (!restaurant) return null;

  return (
    <div className="section">
      <div className="container">
        <div className="restaurant-header">
          <div>
            <p className="eyebrow">{restaurant.isOpen ? 'Open now' : 'Currently closed'}</p>
            <h1>{restaurant.name}</h1>
            <p className="muted">{restaurant.description}</p>
            <div className="restaurant-meta">
              <span>📍 {restaurant.address?.city}</span>
              <span>⭐ {restaurant.rating}</span>
            </div>
          </div>
        </div>

        {message && <p className="success-text">{message}</p>}

        <h2 className="menu-title">Menu</h2>
        <div className="grid food-grid">
          {foodItems.map((item) => (
            <FoodCard key={item._id} item={item} onAdd={handleAdd} />
          ))}
        </div>

        {foodItems.length === 0 && (
          <p className="muted">No menu items available for this restaurant.</p>
        )}
      </div>
    </div>
  );
}
