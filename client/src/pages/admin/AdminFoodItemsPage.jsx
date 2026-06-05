import { useEffect, useState } from 'react';
import { api } from '../../api/client';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  image: '',
  restaurantId: '',
  categoryId: '',
};

export default function AdminFoodItemsPage() {
  const [items, setItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = async () => {
    try {
      const [food, rests, cats] = await Promise.all([
        api.getFoodItems(),
        api.getRestaurants(),
        api.getCategories(),
      ]);
      setItems(food);
      setRestaurants(rests);
      setCategories(cats);
      setForm((f) => ({
        ...f,
        restaurantId: f.restaurantId || rests[0]?._id || '',
        categoryId: f.categoryId || cats[0]?._id || '',
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleImageFile = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { image } = await api.uploadFoodImage(file);
      if (target === 'form') {
        setForm((f) => ({ ...f, image }));
      } else {
        setForm((f) => ({ ...f, image }));
      }
      setMessage('Image uploaded');
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.createFoodItem({
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        image: form.image || undefined,
        restaurantId: form.restaurantId,
        categoryId: form.categoryId,
        isAvailable: true,
      });
      setForm({ ...emptyForm, restaurantId: form.restaurantId, categoryId: form.categoryId });
      setMessage('Menu item added');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setForm({
      name: item.name,
      description: item.description || '',
      price: String(item.price),
      image: item.image || '',
      restaurantId: item.restaurantId?._id || item.restaurantId,
      categoryId: item.categoryId?._id || item.categoryId,
    });
    setMessage('');
    setError('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({ ...emptyForm, restaurantId: restaurants[0]?._id || '', categoryId: categories[0]?._id || '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      await api.updateFoodItem(editingId, {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price),
        image: form.image,
        restaurantId: form.restaurantId,
        categoryId: form.categoryId,
      });
      setMessage('Menu item updated');
      cancelEdit();
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemoveImage = async () => {
    if (!editingId) {
      setForm((f) => ({ ...f, image: '' }));
      return;
    }
    setError('');
    try {
      await api.updateFoodItem(editingId, { image: '' });
      setForm((f) => ({ ...f, image: '' }));
      setMessage('Image removed');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this menu item and its image?')) return;
    try {
      await api.deleteFoodItem(id);
      if (editingId === id) cancelEdit();
      setMessage('Item deleted');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const imagePreview = (url) =>
    url ? (
      <img src={url} alt="" className="admin-item-thumb" />
    ) : (
      <div className="admin-item-thumb admin-item-thumb-empty">No image</div>
    );

  const formFields = (
    <>
      <input
        placeholder="Name"
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
        type="number"
        step="0.01"
        placeholder="Price"
        value={form.price}
        onChange={(e) => setForm({ ...form, price: e.target.value })}
        required
      />
      <input
        placeholder="Image URL (optional)"
        value={form.image}
        onChange={(e) => setForm({ ...form, image: e.target.value })}
      />
      <label className="file-upload-label">
        <span>{uploading ? 'Uploading...' : 'Upload image file'}</span>
        <input
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={(e) => handleImageFile(e, 'form')}
          disabled={uploading}
        />
      </label>
      {form.image && (
        <div className="image-preview-row">
          {imagePreview(form.image)}
          <button type="button" className="btn btn-outline btn-sm" onClick={handleRemoveImage}>
            Remove image
          </button>
        </div>
      )}
      <select
        value={form.restaurantId}
        onChange={(e) => setForm({ ...form, restaurantId: e.target.value })}
        required
      >
        <option value="">Select restaurant</option>
        {restaurants.map((r) => (
          <option key={r._id} value={r._id}>{r.name}</option>
        ))}
      </select>
      <select
        value={form.categoryId}
        onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
        required
      >
        <option value="">Select category</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>
    </>
  );

  if (loading) return <div className="page-loading">Loading...</div>;

  return (
    <div>
      <h1>Menu items</h1>
      <p className="muted">Add, update image, or delete food items</p>
      {error && <p className="error-text">{error}</p>}
      {message && <p className="success-text">{message}</p>}

      <form
        onSubmit={editingId ? handleUpdate : handleCreate}
        className="admin-form-card admin-form-card-wide"
      >
        <h2>{editingId ? 'Update menu item' : 'Add menu item'}</h2>
        {formFields}
        <div className="admin-form-actions">
          <button type="submit" className="btn btn-primary" disabled={uploading}>
            {editingId ? 'Save changes' : 'Add item'}
          </button>
          {editingId && (
            <button type="button" className="btn btn-outline" onClick={cancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      <ul className="admin-list admin-food-list">
        {items.map((item) => (
          <li key={item._id}>
            {imagePreview(item.image)}
            <div className="admin-food-info">
              <strong>{item.name}</strong>
              <p className="muted">
                ${item.price?.toFixed(2)} · {item.restaurantId?.name} · {item.categoryId?.name}
              </p>
            </div>
            <div className="admin-item-actions">
              <button type="button" className="btn btn-outline btn-sm" onClick={() => startEdit(item)}>
                Edit
              </button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => handleDelete(item._id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
