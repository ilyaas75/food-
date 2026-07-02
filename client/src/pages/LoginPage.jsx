import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLES } from '../constants/roles';
import PasswordInput from '../components/PasswordInput';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(form.email.trim().toLowerCase(), form.password);
      const from = location.state?.from?.pathname;
      if (data.role === ROLES.ADMIN) {
        navigate(from?.startsWith('/admin') ? from : '/admin');
      } else {
        navigate(from && !from.startsWith('/admin') ? from : '/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Welcome back</h1>
        <p className="muted">Sign in to order your favorite meals</p>

        {error && <p className="error-text">{error}</p>}

        <form onSubmit={handleSubmit} className="form">
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value.replace(/\s+/g, '') })}
              required
              placeholder="customer@food.com"
            />
          </label>
          <label>
            Password
            <PasswordInput
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              placeholder="password123"
              autoComplete="current-password"
            />
          </label>
          <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-footer">
          New here? <Link to="/register">Create an account</Link>
        </p>
        <p className="demo-hint muted">
          Customer: customer@food.com · Admin: admin@food.com · password123
        </p>
      </div>
    </div>
  );
}
