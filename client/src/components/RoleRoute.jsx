import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';

export default function RoleRoute({ children, roles }) {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="page-loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!roles.includes(user?.role)) {
    const fallback = user?.role === ROLES.ADMIN ? '/admin' : '/';
    return <Navigate to={fallback} replace />;
  }

  return children;
}
