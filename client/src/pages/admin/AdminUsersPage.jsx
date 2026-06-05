import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import PasswordInput from '../../components/PasswordInput';
import AdminRowActions from '../../components/admin/AdminRowActions';
import { useAuth } from '../../context/AuthContext';

const emptyForm = { name: '', email: '', password: '', role: 'customer', phone: '' };

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    api.getUsers().then(setUsers).catch((err) => setError(err.message)).finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      if (editingId) {
        const body = {
          name: form.name,
          email: form.email,
          role: form.role,
          phone: form.phone || undefined,
        };
        if (form.password) body.password = form.password;
        await api.updateUser(editingId, body);
        setMessage('User updated');
      } else {
        await api.createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          role: form.role,
          phone: form.phone || undefined,
        });
        setMessage('User created');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (u) => {
    setEditingId(u._id);
    setForm({
      name: u.name || '',
      email: u.email || '',
      password: '',
      role: u.role || 'customer',
      phone: u.phone || '',
    });
    setMessage('');
    setError('');
  };

  const handleDelete = async (id) => {
    if (id === currentUser?._id) {
      setError('You cannot delete your own account');
      return;
    }
    if (!confirm('Delete this user?')) return;
    try {
      await api.deleteUser(id);
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <h1>Users</h1>
      <p className="muted">Create, read, update, and delete customers and admins</p>
      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      {editingId && (
        <div className="admin-edit-banner">
          <span>Editing user</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={resetForm}>Cancel edit</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form-card admin-form-card-wide">
        <h2>{editingId ? 'Update user' : 'Create user'}</h2>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <PasswordInput
          placeholder={editingId ? 'New password (leave blank to keep)' : 'Password'}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required={!editingId}
          autoComplete="new-password"
        />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
          <option value="customer">Customer</option>
          <option value="admin">Admin</option>
        </select>
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary">{editingId ? 'Save changes' : 'Create user'}</button>
          {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td><span className={`role-pill role-${u.role}`}>{u.role}</span></td>
                <td>
                  <AdminRowActions
                    onEdit={() => startEdit(u)}
                    onDelete={u._id === currentUser?._id ? undefined : () => handleDelete(u._id)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
