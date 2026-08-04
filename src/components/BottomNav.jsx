import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getUnreadCount } from '../data/avisos';
import QuickAccessSheet from './QuickAccessSheet';

const CLOSE_ANIM_MS = 220;

export default function BottomNav() {
  const location = useLocation();
  const path = location.pathname;
  const unread = getUnreadCount();
  const [phase, setPhase] = useState('closed'); // 'closed' | 'open' | 'closing'
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
    { to: '/',            icon: 'ph-house',     label: 'Início',      tx: -87, ty: -50 },
    { to: '/evangelismo', icon: 'ph-megaphone', label: 'Evangelismo', tx: -34, ty: -94 },
    { type: 'menu',       icon: 'ph-squares-four', label: 'Menu',     tx: 34,  ty: -94 },
    { to: '/avisos',      icon: 'ph-bell',      label: 'Avisos',      tx: 87,  ty: -50, badge: unread },
  ];

  const abrir = () => setPhase('open');
  const fechar = () => {
    if (phase !== 'open') return;
    setPhase('closing');
    setTimeout(() => setPhase('closed'), CLOSE_ANIM_MS);
  };

  const emUmDosItens = navItems.some(item => item.to && item.to === path);

  useEffect(() => {
    if (phase === 'closed') return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [phase]);

  return (
    <>
      {phase !== 'closed' && <div className="fab-backdrop" onClick={fechar} />}

      <div className="fab-nav">
        {phase !== 'closed' && (
          <div className="fab-petals">
            {navItems.map((item, i) => {
              const style = { '--tx': `${item.tx}px`, '--ty': `${item.ty}px`, animationDelay: `${i * 0.07}s` };
              const className = `fab-petal ${phase === 'open' ? 'fab-petal-open' : 'fab-petal-closing'} ${item.to === path ? 'active' : ''}`;

              if (item.type === 'menu') {
                return (
                  <button
                    key="menu"
                    className={className}
                    style={style}
                    onClick={() => { fechar(); setMenuAberto(true); }}
                  >
                    <i className={`ph ${item.icon}`}></i>
                    <span>{item.label}</span>
                  </button>
                );
              }
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={className}
                  style={style}
                  onClick={fechar}
                >
                  <i className={`ph ${item.icon}`}></i>
                  {item.badge > 0 && <span className="fab-petal-badge">{item.badge > 9 ? '9+' : item.badge}</span>}
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>
        )}

        <button
          className={`fab-main ${phase === 'open' ? 'open' : ''} ${emUmDosItens ? 'on-tab' : ''}`}
          onClick={phase === 'open' ? fechar : abrir}
          aria-label={phase === 'open' ? 'Fechar menu' : 'Abrir menu'}
        >
          <i key={phase} className={`ph ${phase === 'open' ? 'ph-x' : 'ph-list'}`}></i>
          {unread > 0 && phase !== 'open' && <span className="fab-main-badge">{unread > 9 ? '9+' : unread}</span>}
        </button>
      </div>

      {menuAberto && <QuickAccessSheet onClose={() => setMenuAberto(false)} />}
    </>
  );
}
