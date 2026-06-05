import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import AdminRowActions from '../../components/admin/AdminRowActions';

const emptyForm = { name: '', description: '', city: '', isOpen: true };

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    api.getRestaurants().then(setRestaurants).catch((err) => setError(err.message)).finally(() => setLoading(false));
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
    const body = {
      name: form.name,
      description: form.description,
      address: { city: form.city },
      isOpen: form.isOpen,
    };
    try {
      if (editingId) {
        await api.updateRestaurant(editingId, body);
        setMessage('Restaurant updated');
      } else {
        await api.createRestaurant(body);
        setMessage('Restaurant created');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (r) => {
    setEditingId(r._id);
    setForm({
      name: r.name || '',
      description: r.description || '',
      city: r.address?.city || '',
      isOpen: r.isOpen !== false,
    });
    setMessage('');
    setError('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this restaurant?')) return;
    try {
      await api.deleteRestaurant(id);
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <h1>Restaurants</h1>
      <p className="muted">Full CRUD for restaurant records</p>
      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      {editingId && (
        <div className="admin-edit-banner">
          <span>Editing restaurant</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={resetForm}>Cancel edit</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form-card admin-form-card-wide">
        <h2>{editingId ? 'Update restaurant' : 'Create restaurant'}</h2>
        <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <input placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.isOpen}
            onChange={(e) => setForm({ ...form, isOpen: e.target.checked })}
          />
          Open for orders
        </label>
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary">{editingId ? 'Save changes' : 'Create'}</button>
          {editingId && <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>}
        </div>
      </form>

      <ul className="admin-list">
        {restaurants.map((r) => (
          <li key={r._id}>
            <div>
              <strong>{r.name}</strong>
              <p className="muted">
                {r.description || '—'} · {r.address?.city || '—'} · {r.isOpen ? 'Open' : 'Closed'}
              </p>
            </div>
            <AdminRowActions onEdit={() => startEdit(r)} onDelete={() => handleDelete(r._id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
