import { useEffect, useState } from 'react';
import { api } from '../api/client';
import RestaurantCard from '../components/RestaurantCard';
import heroImage from '../assets/hero.png';

export default function HomePage() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getRestaurants()
      .then(setRestaurants)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!loading && window.location.hash === '#restaurants') {
      document.getElementById('restaurants')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [loading, restaurants.length]);

  return (
    <div>
      <section className="hero">
        <div className="container hero-grid">
          <div className="hero-content">
            <p className="eyebrow">Fast · Fresh · Local</p>
            <h1>Your favorite meals, delivered in minutes</h1>
            <p className="hero-text">
              Browse top restaurants, add dishes to your cart, and track orders from kitchen to doorstep.
            </p>
          </div>
          <div className="hero-image-wrap">
            <img src={heroImage} alt="Delicious food delivery" />
          </div>
        </div>
      </section>

      <section id="restaurants" className="section">
        <div className="container">
          <div className="section-header">
            <h2>Restaurants near you</h2>
            <p>Pick a restaurant to explore the menu</p>
          </div>

          {loading && <p className="muted">Loading restaurants...</p>}
          {error && <p className="error-text">{error}</p>}

          {!loading && !error && (
            <div className="grid restaurants-grid">
              {restaurants.length === 0 ? (
                <p className="muted">No restaurants yet. Run <code>npm run seed</code> on the backend.</p>
              ) : (
                restaurants.map((r) => <RestaurantCard key={r._id} restaurant={r} />)
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
