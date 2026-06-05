import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';

const emptyAddress = { street: '', city: '', state: '', zipCode: '', country: '' };

export default function ProfilePage() {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    addresses: [emptyAddress],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadProfile = () => {
    setLoading(true);
    api.getProfile()
      .then((data) => {
        setProfile(data);
        setForm({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          password: '',
          addresses: data.addresses?.length ? data.addresses : [emptyAddress],
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    const body = {
      name: form.name,
      email: form.email,
      phone: form.phone || undefined,
      addresses: form.addresses.filter((a) => a.street || a.city),
    };
    if (form.password) body.password = form.password;
    try {
      const updated = await updateProfile(body);
      setProfile(updated);
      setEditing(false);
      setForm((f) => ({ ...f, password: '' }));
      setMessage('Profile updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Delete your account permanently? This cannot be undone.')) return;
    setError('');
    try {
      await api.deleteProfile();
      logout();
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  const updateAddress = (index, field, value) => {
    setForm((f) => {
      const addresses = [...f.addresses];
      addresses[index] = { ...addresses[index], [field]: value };
      return { ...f, addresses };
    });
  };

  const addAddress = () => {
    setForm((f) => ({ ...f, addresses: [...f.addresses, { ...emptyAddress }] }));
  };

  const removeAddress = (index) => {
    setForm((f) => ({
      ...f,
      addresses: f.addresses.filter((_, i) => i !== index),
    }));
  };

  if (loading) return <div className="page-loading">Loading profile...</div>;

  const data = profile || user;

  return (
    <div className="section">
      <div className="container profile-card">
        <div className="profile-header">
          <div>
            <h1>Profile</h1>
            <p className="muted">View and manage your account</p>
          </div>
          {!editing && (
            <button type="button" className="btn btn-primary" onClick={() => setEditing(true)}>
              Edit profile
            </button>
          )}
        </div>

        {error && <p className="error-text">{error}</p>}
        {message && <p className="success-text">{message}</p>}

        {!editing ? (
          <>
            <dl className="profile-list">
              <div>
                <dt>Name</dt>
                <dd>{data?.name}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{data?.email}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>
                  <span className={`role-pill role-${data?.role}`}>{data?.role}</span>
                </dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{data?.phone || '—'}</dd>
              </div>
            </dl>

            {data?.addresses?.length > 0 && (
              <>
                <h2>Saved addresses</h2>
                {data.addresses.map((addr, i) => (
                  <p key={i} className="address-block">
                    {addr.street}, {addr.city}, {addr.state} {addr.zipCode}, {addr.country}
                  </p>
                ))}
              </>
            )}
          </>
        ) : (
          <form onSubmit={handleSave} className="admin-form-card profile-form">
            <h2>Update profile</h2>
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <PasswordInput
              placeholder="New password (optional)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              autoComplete="new-password"
            />

            <h3 className="profile-form-subtitle">Addresses</h3>
            {form.addresses.map((addr, i) => (
              <div key={i} className="profile-address-group">
                <input
                  placeholder="Street"
                  value={addr.street}
                  onChange={(e) => updateAddress(i, 'street', e.target.value)}
                />
                <input
                  placeholder="City"
                  value={addr.city}
                  onChange={(e) => updateAddress(i, 'city', e.target.value)}
                />
                <input
                  placeholder="State"
                  value={addr.state}
                  onChange={(e) => updateAddress(i, 'state', e.target.value)}
                />
                <input
                  placeholder="Zip"
                  value={addr.zipCode}
                  onChange={(e) => updateAddress(i, 'zipCode', e.target.value)}
                />
                <input
                  placeholder="Country"
                  value={addr.country}
                  onChange={(e) => updateAddress(i, 'country', e.target.value)}
                />
                {form.addresses.length > 1 && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => removeAddress(i)}>
                    Remove address
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-outline btn-sm" onClick={addAddress}>
              Add address
            </button>

            <div className="admin-form-actions">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => {
                  setEditing(false);
                  setError('');
                  loadProfile();
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <section className="profile-danger-zone">
          <h2>Delete account</h2>
          <p className="muted">Permanently remove your account and data.</p>
          <button type="button" className="btn btn-outline btn-danger" onClick={handleDeleteAccount}>
            Delete my account
          </button>
        </section>

        <p className="muted profile-hint">
          New accounts are created via <strong>Sign up</strong> (register). Role changes are managed by an admin.
        </p>
      </div>
    </div>
  );
}
