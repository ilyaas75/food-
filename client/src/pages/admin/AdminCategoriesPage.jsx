import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import AdminRowActions from '../../components/admin/AdminRowActions';

const emptyForm = { name: '', description: '', image: '' };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    setLoading(true);
    api.getCategories().then(setCategories).catch((err) => setError(err.message)).finally(() => setLoading(false));
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
        await api.updateCategory(editingId, form);
        setMessage('Category updated');
      } else {
        await api.createCategory(form);
        setMessage('Category created');
      }
      resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (cat) => {
    setEditingId(cat._id);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
    });
    setMessage('');
    setError('');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await api.deleteCategory(id);
      if (editingId === id) resetForm();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <h1>Categories</h1>
      <p className="muted">Create, read, update, and delete menu categories</p>
      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      {editingId && (
        <div className="admin-edit-banner">
          <span>Editing category</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={resetForm}>Cancel edit</button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="admin-form-card admin-form-card-wide">
        <h2>{editingId ? 'Update category' : 'Create category'}</h2>
        <input
          placeholder="Category name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <input
          placeholder="Image URL (optional)"
          value={form.image}
          onChange={(e) => setForm({ ...form, image: e.target.value })}
        />
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary">{editingId ? 'Save changes' : 'Add category'}</button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={resetForm}>Cancel</button>
          )}
        </div>
      </form>

      <ul className="admin-list">
        {categories.map((cat) => (
          <li key={cat._id}>
            <div>
              <strong>{cat.name}</strong>
              <p className="muted">{cat.description || '—'}</p>
            </div>
            <AdminRowActions onEdit={() => startEdit(cat)} onDelete={() => handleDelete(cat._id)} />
          </li>
        ))}
      </ul>
    </div>
  );
}
