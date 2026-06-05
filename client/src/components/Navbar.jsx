import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isAuthenticated, isAdmin, isCustomer } = useAuth();

  return (
    <header className="navbar">
      <div className="container navbar-inner">
        <Link to={isAdmin ? '/admin' : '/'} className="brand">
          <span className="brand-icon">🍽️</span>
          FoodExpress
        </Link>

        <nav className="nav-links">
          {isAdmin ? (
            <NavLink to="/admin">Dashboard</NavLink>
          ) : (
            <NavLink to="/" end>Home</NavLink>
          )}
          {isCustomer && (
            <>
              <NavLink to="/orders">Orders</NavLink>
              <NavLink to="/cart">Cart</NavLink>
            </>
          )}
          {isAuthenticated && (
            <NavLink to="/profile">Profile</NavLink>
          )}
        </nav>

        <div className="nav-actions">
          {isAuthenticated ? (
            <>
              <span className="user-greeting">
                {user?.name?.split(' ')[0]}
                <span className={`role-pill role-${user?.role}`}>{user?.role}</span>
              </span>
              <button type="button" className="btn btn-outline" onClick={logout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-outline">Login</Link>
              <Link to="/register" className="btn btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
