import { useState, useEffect } from 'react';
import orderService from '../services/orderService';
import Card from '../components/UI/Card';
import Badge from '../components/UI/Badge';
import LoadingSpinner from '../components/UI/LoadingSpinner';

const STAT_CARDS = [
  {
    key: 'total_products',
    label: 'Total Products',
    icon: '📦',
    color: '#3b82f6',
    accent: 'stat-card-indigo',
  },
  {
    key: 'total_customers',
    label: 'Total Customers',
    icon: '👤',
    color: '#8b5cf6',
    accent: 'stat-card-violet',
  },
  {
    key: 'total_orders',
    label: 'Total Orders',
    icon: '🛍️',
    color: '#10b981',
    accent: 'stat-card-emerald',
  },
  {
    key: 'low_stock_count',
    label: 'Low Stock Items',
    icon: '⚠️',
    color: '#f59e0b',
    accent: 'stat-card-amber',
  },
];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = () => {
    setLoading(true);
    orderService.getStats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchStats(); }, []);

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className="empty-state">
        <span className="empty-state-icon">⚠️</span>
        <h3>Could not load dashboard</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchStats}>Retry</button>
      </div>
    );
  }

  return (
    <div>
      {/* Stat Cards */}
      <div className="stats-grid">
        {STAT_CARDS.map(({ key, label, icon, color, accent }) => (
          <div key={key} className={`card stat-card ${accent}`} style={{ borderLeft: `4px solid ${color}` }}>
            <span className="stat-icon">{icon}</span>
            <div className="stat-value" style={{ color }}>
              {stats?.[key] ?? 0}
            </div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <span style={{ fontSize: '1.25rem' }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#1a202c' }}>
              Low Stock Alert
            </h3>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#718096' }}>
              Products with 10 or fewer units in stock
            </p>
          </div>
          <Badge status="low-stock" label={`${stats?.low_stock_count ?? 0} items`} />
        </div>

        {stats?.low_stock_products?.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Stock Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats.low_stock_products.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 500, color: '#1a202c' }}>{p.name}</td>
                    <td>
                      <code
                        style={{
                          background: '#edf2f7',
                          padding: '0.15rem 0.4rem',
                          borderRadius: '0.25rem',
                          fontSize: '0.8rem',
                          color: '#2c5282',
                        }}
                      >
                        {p.sku}
                      </code>
                    </td>
                    <td>
                      <span
                        style={{
                          color: p.quantity_in_stock === 0 ? '#dc2626' : '#f59e0b',
                          fontWeight: 700,
                        }}
                      >
                        {p.quantity_in_stock}
                      </span>
                    </td>
                    <td>
                      <Badge
                        status={p.quantity_in_stock === 0 ? 'cancelled' : 'low-stock'}
                        label={p.quantity_in_stock === 0 ? 'Out of Stock' : 'Low Stock'}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state" style={{ padding: '2rem' }}>
            <span className="empty-state-icon">✅</span>
            <h3>All stock levels are healthy</h3>
            <p>No products are running low on inventory.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
