import { useLocation } from 'react-router-dom';

const TITLES = {
  '/': 'Dashboard',
  '/products': 'Products',
  '/customers': 'Customers',
  '/orders': 'Orders',
};

export default function Navbar() {
  const { pathname } = useLocation();
  const title = TITLES[pathname] || 'InvenFlow';

  return (
    <header className="topbar">
      <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600, color: '#1a202c' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#10b981',
          }}
        />
        <span style={{ fontSize: '0.8rem', color: '#718096', fontWeight: 500 }}>
          Connected
        </span>
      </div>
    </header>
  );
}
