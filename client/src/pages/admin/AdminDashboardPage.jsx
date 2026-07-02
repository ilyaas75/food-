import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  AreaChart,
  Area,
} from 'recharts';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import DashboardPreviewModal from '../../components/admin/DashboardPreviewModal';
import {
  ShoppingBag,
  Store,
  Users,
  CreditCard,
  TrendingUp,
  Clock,
  Package,
  ArrowRight,
  ExternalLink,
  PlusCircle,
  UtensilsCrossed,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  PieChart as PieChartIcon,
  Eye,
} from '../../components/admin/AdminIcons';

const CHART_PALETTE = ['#e85d04', '#2563eb', '#16a34a', '#7c3aed', '#06b6d4', '#ec4899', '#eab308'];

const statusConfig = {
  pending: { label: 'Pending', color: '#f59e0b' },
  confirmed: { label: 'Confirmed', color: '#3b82f6' },
  preparing: { label: 'Preparing', color: '#8b5cf6' },
  'out-for-delivery': { label: 'Out for delivery', color: '#06b6d4' },
  delivered: { label: 'Delivered', color: '#22c55e' },
  cancelled: { label: 'Cancelled', color: '#ef4444' },
};

const getLast7Days = (orders) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    days.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { weekday: 'short' }),
      orders: 0,
      revenue: 0,
    });
  }
  orders.forEach((o) => {
    const key = new Date(o.createdAt).toISOString().slice(0, 10);
    const day = days.find((x) => x.date === key);
    if (day) {
      day.orders += 1;
      day.revenue += o.totalAmount || 0;
    }
  });
  return days;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      {payload.map((p) => (
        <span key={p.name} style={{ color: p.color }}>
          {p.name}: {typeof p.value === 'number' && p.name === 'revenue' ? `$${p.value.toFixed(2)}` : p.value}
        </span>
      ))}
    </div>
  );
};

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getOrders(),
      api.getRestaurants(),
      api.getUsers(),
      api.getPayments(),
      api.getFoodItems(),
    ])
      .then(([o, r, u, p, f]) => {
        setOrders(o);
        setRestaurants(r);
        setUsers(u);
        setPayments(p);
        setFoodItems(f);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setPreview(null);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const metrics = useMemo(() => {
    const paidStatuses = ['completed', 'approved', 'refunded'];
    const revenue = payments
      .filter((p) => paidStatuses.includes(p.status))
      .reduce((sum, p) => sum + (p.status === 'refunded' ? 0 : p.amount || 0), 0);
    const pendingPayments = payments.filter((p) => p.verificationStatus === 'pending' || p.status === 'pending').length;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const customers = users.filter((u) => u.role === 'customer').length;
    const admins = users.filter((u) => u.role === 'admin').length;
    const statusCounts = orders.reduce((acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      return acc;
    }, {});

    return { revenue, pending, pendingPayments, delivered, customers, admins, statusCounts };
  }, [orders, payments, users]);

  const weeklyData = useMemo(() => getLast7Days(orders), [orders]);

  const pieData = useMemo(
    () =>
      Object.entries(statusConfig)
        .map(([key, cfg]) => ({
          name: cfg.label,
          value: metrics.statusCounts[key] || 0,
          color: cfg.color,
        }))
        .filter((d) => d.value > 0),
    [metrics.statusCounts]
  );

  const rolePieData = useMemo(
    () => [
      { name: 'Customers', value: metrics.customers, color: '#2563eb' },
      { name: 'Admins', value: metrics.admins, color: '#e85d04' },
    ].filter((d) => d.value > 0),
    [metrics]
  );

  const paymentMethodData = useMemo(() => {
    const labels = {
      waafi: 'WaafiPay',
      bank_transfer: 'Bank',
      cash_on_delivery: 'Cash',
      cash: 'Cash',
      credit_card: 'Card',
      paypal: 'PayPal',
    };

    return Object.entries(
      payments.reduce((acc, p) => {
        acc[p.paymentMethod] = (acc[p.paymentMethod] || 0) + 1;
        return acc;
      }, {})
    ).map(([method, value], index) => ({
      name: labels[method] || method,
      value,
      fill: CHART_PALETTE[index % CHART_PALETTE.length],
    }));
  }, [payments]);

  const topRestaurantData = useMemo(() => {
    const totals = orders.reduce((acc, order) => {
      const name = order.restaurantId?.name || 'Unknown';
      acc[name] = {
        name,
        orders: (acc[name]?.orders || 0) + 1,
        revenue: (acc[name]?.revenue || 0) + (order.totalAmount || 0),
      };
      return acc;
    }, {});

    return Object.values(totals)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [orders]);

  const recentOrders = useMemo(
    () => [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [orders]
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const statCards = [
    {
      key: 'orders',
      label: 'Total orders',
      value: orders.length,
      icon: ShoppingBag,
      gradient: 'linear-gradient(135deg, #e85d04 0%, #f97316 100%)',
      sub: `${metrics.pending} pending`,
      to: '/admin/orders',
    },
    {
      key: 'revenue',
      label: 'Revenue',
      value: `$${metrics.revenue.toFixed(2)}`,
      icon: TrendingUp,
      gradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
      sub: `${payments.length} payments`,
      to: '/admin/payments',
    },
    {
      key: 'restaurants',
      label: 'Restaurants',
      value: restaurants.length,
      icon: Store,
      gradient: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)',
      sub: `${foodItems.length} menu items`,
      to: '/admin/restaurants',
    },
    {
      key: 'users',
      label: 'Users',
      value: users.length,
      icon: Users,
      gradient: 'linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)',
      sub: `${metrics.customers} customers`,
      to: '/admin/users',
    },
  ];

  const renderOrdersPreview = () => (
    <>
      <div className="dash-charts-row">
        <div className="dash-chart-box">
          <h3>Orders this week</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="orders" name="Orders" fill="#e85d04" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-chart-box">
          <h3>Status breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pieData.length ? pieData : [{ name: 'No data', value: 1, color: '#e2e8f0' }]}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {(pieData.length ? pieData : [{ color: '#e2e8f0' }]).map((entry, i) => (
                  <Cell key={entry.name} fill={entry.color || CHART_PALETTE[i % CHART_PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <ul className="dash-preview-list">
        {recentOrders.map((o) => (
          <li key={o._id}>
            <span>{o.restaurantId?.name}</span>
            <span>${o.totalAmount?.toFixed(2)}</span>
            <span className="dash-preview-pill">{o.status}</span>
          </li>
        ))}
      </ul>
    </>
  );

  const renderRevenuePreview = () => (
    <div className="dash-chart-box dash-chart-box-full">
      <h3>Revenue trend (7 days)</h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={weeklyData}>
          <defs>
            <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="revenue"
            name="revenue"
            stroke="#16a34a"
            fill="url(#revenueGrad)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  const renderRestaurantsPreview = () => (
    <ul className="dash-preview-list">
      {restaurants.map((r) => (
        <li key={r._id}>
          <span><strong>{r.name}</strong></span>
          <span className="muted">{r.address?.city || '—'}</span>
          <span>{r.isOpen ? '🟢 Open' : '🔴 Closed'}</span>
        </li>
      ))}
    </ul>
  );

  const renderUsersPreview = () => (
    <>
      <div className="dash-chart-box" style={{ maxWidth: 320, margin: '0 auto 1rem' }}>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie data={rolePieData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
              {rolePieData.map((entry, i) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="dash-preview-list">
        {users.slice(0, 8).map((u) => (
          <li key={u._id}>
            <span>{u.name}</span>
            <span className="muted">{u.email}</span>
            <span className={`role-pill role-${u.role}`}>{u.role}</span>
          </li>
        ))}
      </ul>
    </>
  );

  const previewConfig = {
    orders: { title: 'Orders overview', subtitle: 'Charts & recent activity', content: renderOrdersPreview, to: '/admin/orders' },
    revenue: { title: 'Revenue analytics', subtitle: 'Last 7 days performance', content: renderRevenuePreview, to: '/admin/payments' },
    restaurants: { title: 'Restaurants', subtitle: `${restaurants.length} partners`, content: renderRestaurantsPreview, to: '/admin/restaurants' },
    users: { title: 'Users', subtitle: `${users.length} accounts`, content: renderUsersPreview, to: '/admin/users' },
  };

  if (loading) {
    return (
      <div className="admin-dashboard-loading">
        <div className="admin-spinner" />
        <p>Loading dashboard...</p>
      </div>
    );
  }

  const activePreview = preview ? previewConfig[preview] : null;

  return (
    <div className="admin-dashboard">
      <div className="admin-hero-banner">
        <div className="admin-hero-content">
          <p className="admin-dash-eyebrow">{greeting()}</p>
          <h1>{user?.name?.split(' ')[0] || 'Admin'}</h1>
          <p>
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        <div className="admin-dash-header-actions">
          <Link to="/admin/food-items" className="btn btn-primary">
            <PlusCircle size={18} />
            New menu item
          </Link>
          <Link to="/" className="btn btn-hero-outline">
            <ExternalLink size={18} />
            Public site
          </Link>
        </div>
      </div>

      {metrics.pending > 0 && (
        <div className="admin-alert">
          <AlertCircle size={20} />
          <div>
            <strong>{metrics.pending} order{metrics.pending > 1 ? 's' : ''} need attention</strong>
            <p>Click any card below for charts & preview.</p>
          </div>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => setPreview('orders')}>
            <Eye size={16} /> Preview
          </button>
        </div>
      )}

      <p className="dash-click-hint">
        <Eye size={14} /> Click a stat card or chart section to open preview
      </p>

      <div className="admin-stat-grid">
        {statCards.map(({ key, label, value, icon: Icon, gradient, sub, to }) => (
          <button
            key={key}
            type="button"
            className="admin-stat-card-v2 admin-stat-card-clickable"
            onClick={() => setPreview(key)}
          >
            <div className="admin-stat-icon-gradient" style={{ background: gradient }}>
              <Icon size={24} color="white" />
            </div>
            <div className="admin-stat-body">
              <span className="admin-stat-label">{label}</span>
              <span className="admin-stat-value">{value}</span>
              <span className="admin-stat-sub">{sub} · Preview</span>
            </div>
            <ArrowRight size={16} className="admin-stat-arrow" />
          </button>
        ))}
      </div>

      <div className="admin-dash-grid">
        <section
          className="admin-panel admin-panel-clickable"
          onClick={() => setPreview('orders')}
          onKeyDown={(e) => e.key === 'Enter' && setPreview('orders')}
          role="button"
          tabIndex={0}
        >
          <div className="admin-panel-head">
            <h2>
              <Clock size={20} />
              Recent orders
            </h2>
            <span className="admin-panel-preview-tag">
              <PieChartIcon size={14} /> Click preview
            </span>
          </div>
          {recentOrders.length === 0 ? (
            <p className="admin-panel-empty muted">No orders yet.</p>
          ) : (
            <div className="admin-recent-list">
              {recentOrders.slice(0, 3).map((order) => {
                const st = statusConfig[order.status] || statusConfig.pending;
                return (
                  <div key={order._id} className="admin-recent-item">
                    <div className="admin-recent-icon">
                      <Package size={18} />
                    </div>
                    <div className="admin-recent-info">
                      <strong>{order.restaurantId?.name || 'Restaurant'}</strong>
                      <span className="muted">{order.customerId?.name}</span>
                    </div>
                    <span className="admin-recent-price">${order.totalAmount?.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section
          className="admin-panel admin-panel-clickable"
          onClick={() => setPreview('orders')}
          onKeyDown={(e) => e.key === 'Enter' && setPreview('orders')}
          role="button"
          tabIndex={0}
        >
          <div className="admin-panel-head">
            <h2>
              <BarChart3 size={20} />
              Weekly activity
            </h2>
            <span className="admin-panel-preview-tag">Charts</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={weeklyData}>
              <Bar dataKey="orders" fill="#e85d04" radius={[4, 4, 0, 0]} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <section className="admin-panel admin-panel-charts">
        <div className="admin-panel-head">
          <div>
            <p className="admin-panel-kicker">Live business intelligence</p>
            <h2>Beautiful analytics dashboard</h2>
          </div>
          <button type="button" className="admin-panel-link" onClick={() => setPreview('revenue')}>
            <Eye size={14} /> Revenue preview
          </button>
        </div>

        <div className="dash-analytics-suite">
          <div className="dash-big-chart dash-glass-card" onClick={() => setPreview('revenue')} role="button" tabIndex={0}>
            <div className="dash-chart-head">
              <div>
                <span className="dash-chart-label">Revenue trend</span>
                <strong>${metrics.revenue.toFixed(2)}</strong>
              </div>
              <span className="dash-chart-chip">Last 7 days</span>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="dashRevenueGlow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity={0.45} />
                    <stop offset="90%" stopColor="#22c55e" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="revenue"
                  stroke="#16a34a"
                  fill="url(#dashRevenueGlow)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="dash-donut-card dash-glass-card" onClick={() => setPreview('orders')} role="button" tabIndex={0}>
            <div className="dash-chart-head">
              <div>
                <span className="dash-chart-label">Order status</span>
                <strong>{orders.length} orders</strong>
              </div>
              <span className="dash-chart-chip">{metrics.pending} pending</span>
            </div>
            <div className="dash-donut-wrap">
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie
                    data={pieData.length ? pieData : [{ name: 'No data', value: 1, color: '#e2e8f0' }]}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={86}
                    paddingAngle={4}
                  >
                    {(pieData.length ? pieData : [{ name: 'No data', color: '#e2e8f0' }]).map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="dash-status-legend">
                {(pieData.length ? pieData : [{ name: 'No orders', value: 0, color: '#94a3b8' }]).map((item) => (
                  <span key={item.name}>
                    <i style={{ background: item.color }} />
                    {item.name} ({item.value})
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="dash-side-card dash-glass-card" onClick={() => setPreview('revenue')} role="button" tabIndex={0}>
            <div className="dash-chart-head">
              <div>
                <span className="dash-chart-label">Payment methods</span>
                <strong>{payments.length} payments</strong>
              </div>
              <span className="dash-chart-chip">{metrics.pendingPayments} pending</span>
            </div>
            <ResponsiveContainer width="100%" height={190}>
              <BarChart data={paymentMethodData.length ? paymentMethodData : [{ name: 'No data', value: 0, fill: '#e2e8f0' }]} layout="vertical">
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="name" width={82} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {(paymentMethodData.length ? paymentMethodData : [{ fill: '#e2e8f0' }]).map((entry, i) => (
                    <Cell key={entry.name || i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="dash-side-card dash-glass-card">
            <div className="dash-chart-head">
              <div>
                <span className="dash-chart-label">Top restaurants</span>
                <strong>By revenue</strong>
              </div>
              <span className="dash-chart-chip">{restaurants.length} partners</span>
            </div>
            <div className="dash-top-list">
              {(topRestaurantData.length ? topRestaurantData : [{ name: 'No restaurant data', orders: 0, revenue: 0 }]).map((restaurant, index) => (
                <div key={restaurant.name} className="dash-top-item">
                  <span className="dash-top-rank">{index + 1}</span>
                  <div>
                    <strong>{restaurant.name}</strong>
                    <small>{restaurant.orders} orders</small>
                  </div>
                  <span>${restaurant.revenue.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="admin-mini-stats">
          <div className="admin-mini-stat">
            <CheckCircle2 size={18} color="#22c55e" />
            <span>{metrics.delivered} delivered</span>
          </div>
          <div className="admin-mini-stat">
            <CreditCard size={18} color="#e85d04" />
            <span>${metrics.revenue.toFixed(2)} total</span>
          </div>
          <div className="admin-mini-stat">
            <Clock size={18} color="#f59e0b" />
            <span>{metrics.pendingPayments} pending payments</span>
          </div>
        </div>
      </section>

      {activePreview && (
        <DashboardPreviewModal
          title={activePreview.title}
          subtitle={activePreview.subtitle}
          actionTo={activePreview.to}
          onClose={() => setPreview(null)}
        >
          {activePreview.content}
        </DashboardPreviewModal>
      )}
    </div>
  );
}
