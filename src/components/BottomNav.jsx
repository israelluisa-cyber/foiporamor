import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUnreadCount } from '../pages/Avisos';

const MAIS_ITEMS = [
  { label: 'Admin',          icon: 'ph-shield-check',        to: '/admin' },
  { label: 'Carteira',       icon: 'ph-identification-card', to: '/carteira',       apenasLogado: true },
  { label: 'Aconselhamento', icon: 'ph-chat-circle-dots',    to: '/aconselhamento' },
  { label: 'Voluntários',    icon: 'ph-heart',               to: '/voluntarios' },
  { label: 'Bíblia',         icon: 'ph-book-bookmark',       to: '/biblia' },
  { label: 'Devocional',     icon: 'ph-sun-horizon',         to: '/devocional' },
];

function isLogado() {
  try { return !!JSON.parse(sessionStorage.getItem('user_session')); }
  catch { return false; }
}

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [mais, setMais] = useState(false);
  const unread = getUnreadCount();
  const logado = isLogado();
  const maisItemsFiltrados = MAIS_ITEMS.filter(item => !item.apenasLogado || logado);

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
    { to: '/avisos',      icon: 'ph-bell',      label: 'Avisos', badge: unread },
  ];

  return (
    <>
      {/* Menu "Mais" — overlay */}
      {mais && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'flex-end',
          }}
          onClick={() => setMais(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            translate="no"
            style={{
              width: '100%', maxWidth: '600px', margin: '0 auto',
              background: '#141414', borderTop: '1px solid #333',
              borderRadius: '20px 20px 0 0', padding: '20px 16px 100px',
              animation: 'slideUp 0.25s ease',
            }}
          >
            <div style={{ width: '36px', height: '4px', background: '#333', borderRadius: '2px', margin: '0 auto 20px' }} />
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 600, marginBottom: '16px' }}>Todos os Recursos</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {maisItemsFiltrados.map(item => (
                <button
                  key={item.to}
                  onClick={() => { setMais(false); navigate(item.to); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                    padding: '12px 4px', borderRadius: 'var(--radius-md)',
                    background: path === item.to ? 'var(--bg-surface-elevated)' : 'none',
                    border: `1px solid ${path === item.to ? 'var(--border-color)' : 'transparent'}`,
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ width: '44px', height: '44px', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: 'var(--text-primary)' }}>
                    <i className={`ph ${item.icon}`}></i>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <nav className="bottom-nav" translate="no">
        {navItems.map(item => (
          <Link key={item.to} to={item.to} className={`nav-item ${path === item.to ? 'active' : ''}`} style={{ position: 'relative' }}>
            <i className={`ph ${item.icon} nav-icon`}></i>
            {item.badge > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '6px',
                background: '#dc2626', color: '#fff', fontSize: '0.6rem', fontWeight: 700,
                width: '16px', height: '16px', borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.badge > 9 ? '9+' : item.badge}
              </span>
            )}
            <span>{item.label}</span>
          </Link>
        ))}

        <button
          className={`nav-item ${mais ? 'active' : ''}`}
          onClick={() => setMais(m => !m)}
        >
          <i className={`ph ${mais ? 'ph-x' : 'ph-grid-four'} nav-icon`}></i>
          <span>Mais</span>
        </button>
      </nav>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
