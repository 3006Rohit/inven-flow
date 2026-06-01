import { NavLink } from 'react-router-dom';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/customers', label: 'Customers', icon: '�' },
  { to: '/orders', label: 'Orders', icon: '🛍️' },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>InvenFlow</h1>
        <p>Inventory Management</p>
      </div>

      <nav className="sidebar-nav">
        <span className="nav-section-label">Menu</span>
        {NAV_ITEMS.map(({ to, label, icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div style={{ marginBottom: '0.35rem', color: '#2c5282', fontWeight: 600, fontSize: '0.8rem' }}>
          InvenFlow v1.0
        </div>
        <div style={{ fontSize: '0.7rem', color: '#718096' }}>Inventory System</div>
      </div>
    </aside>
  );
}
