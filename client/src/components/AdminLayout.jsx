import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Store,
  UtensilsCrossed,
  Tags,
  Users,
  CreditCard,
  Truck,
  ShoppingCart,
} from './admin/AdminIcons';

const links = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/admin/restaurants', label: 'Restaurants', icon: Store },
  { to: '/admin/food-items', label: 'Menu items', icon: UtensilsCrossed },
  { to: '/admin/categories', label: 'Categories', icon: Tags },
  { to: '/admin/users', label: 'Users', icon: Users },
  { to: '/admin/payments', label: 'Payments', icon: CreditCard },
  { to: '/admin/delivery', label: 'Deliveries', icon: Truck },
  { to: '/admin/carts', label: 'Carts', icon: ShoppingCart },
];

export default function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-brand">
          <span className="admin-sidebar-logo">🍽️</span>
          <div>
            <strong>FoodExpress</strong>
            <span>Admin panel</span>
          </div>
        </div>
        <div className="admin-sidebar-user">
          <div className="admin-sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || 'A'}
          </div>
          <div>
            <p className="admin-sidebar-name">{user?.name}</p>
            <span className="admin-badge">Admin</span>
          </div>
        </div>
        <nav className="admin-nav">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                isActive ? 'admin-nav-link active' : 'admin-nav-link'
              }
            >
              <Icon size={18} strokeWidth={2} aria-hidden />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
