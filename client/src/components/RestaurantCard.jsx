import { Link } from 'react-router-dom';

export default function RestaurantCard({ restaurant }) {
  const city = restaurant.address?.city || 'Your city';

  return (
    <Link to={`/restaurants/${restaurant._id}`} className="restaurant-card">
      <div className="restaurant-card-image">
        <span>{restaurant.isOpen ? '🟢 Open' : '🔴 Closed'}</span>
      </div>
      <div className="restaurant-card-body">
        <h3>{restaurant.name}</h3>
        <p>{restaurant.description || 'Delicious food delivered fast.'}</p>
        <div className="restaurant-meta">
          <span>📍 {city}</span>
          <span>⭐ {restaurant.rating || '4.5'}</span>
        </div>
      </div>
    </Link>
  );
}
