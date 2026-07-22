import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getUnreadCount } from '../data/avisos';
import QuickAccessSheet from './QuickAccessSheet';

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const unread = getUnreadCount();
  const [menuAberto, setMenuAberto] = useState(false);

  if (path === '/admin') {
    return (
      <nav className="bottom-nav" translate="no">
        <Link to="/" className="nav-item">
          <i className="ph ph-house nav-icon"></i>
          <span>Início</span>
        </Link>
        <Link to="/admin" className="nav-item active">
          <i className="ph ph-chart-pie-slice nav-icon"></i>
          <span>Dashboard</span>
        </Link>
      </nav>
    );
  }

  const navItems = [
    { to: '/',            icon: 'ph-house',     label: 'Início' },
    { to: '/evangelismo', icon: 'ph-megaphone', label: 'Evangelismo' },
  ];

  return (
    <>
      <nav className="bottom-nav" translate="no">
        {navItems.map(item => (
          <Link key={item.to} to={item.to} className={`nav-item ${path === item.to ? 'active' : ''}`} style={{ position: 'relative' }}>
            <i className={`ph ${item.icon} nav-icon`}></i>
            <span>{item.label}</span>
          </Link>
        ))}
        <button
          onClick={() => setMenuAberto(true)}
          className={`nav-item ${menuAberto ? 'active' : ''}`}
        >
          <i className="ph ph-squares-four nav-icon"></i>
          <span>Menu</span>
        </button>
        <Link to="/avisos" className={`nav-item ${path === '/avisos' ? 'active' : ''}`} style={{ position: 'relative' }}>
          <i className="ph ph-bell nav-icon"></i>
          {unread > 0 && (
            <span style={{
              position: 'absolute', top: '4px', right: '6px',
              background: '#dc2626', color: '#fff', fontSize: '0.6rem', fontWeight: 700,
              width: '16px', height: '16px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {unread > 9 ? '9+' : unread}
            </span>
          )}
          <span>Avisos</span>
        </Link>
      </nav>
      {menuAberto && <QuickAccessSheet onClose={() => setMenuAberto(false)} />}
    </>
  );
}
