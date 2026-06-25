import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function getSaudacao() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return { periodo: 'Bom dia',    periodo2: 'dia'   };
  if (h >= 12 && h < 18) return { periodo: 'Boa tarde', periodo2: 'dia'   };
  return                         { periodo: 'Boa noite', periodo2: 'noite' };
}

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('user_session')); }
  catch { return null; }
}

function loadNotificacoes() {
  try {
    const admin = JSON.parse(localStorage.getItem('admin_avisos') || '[]');
    const lidos = JSON.parse(localStorage.getItem('avisos_lidos') || '[]');
    return admin.slice(0, 5).map(a => ({ ...a, lida: lidos.includes(a.id) }));
  } catch { return []; }
}

export default function Header({ title, backButton = false, admin = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { periodo, periodo2 } = getSaudacao();
  const session = getSession();

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true;
  });

  const [sinoAberto, setSinoAberto] = useState(false);
  const [notificacoes, setNotificacoes] = useState(loadNotificacoes);
  const sinoRef = useRef(null);

  useEffect(() => {
    document.body.classList.toggle('light', !darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => {
    const handleClick = (e) => {
      if (sinoRef.current && !sinoRef.current.contains(e.target)) {
        setSinoAberto(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const naoLidas = notificacoes.filter(n => !n.lida).length;

  const marcarTodasLidas = () => {
    const lidos = JSON.parse(localStorage.getItem('avisos_lidos') || '[]');
    const novosLidos = [...new Set([...lidos, ...notificacoes.map(n => n.id)])];
    localStorage.setItem('avisos_lidos', JSON.stringify(novosLidos));
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  if (admin) {
    return (
      <header className="app-header" style={{ background: 'rgba(0,0,0,0.8)' }}>
        <div className="header-content">
          <div className="user-greeting" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.jpeg" alt="Logo Foi Por Amor" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <p className="text-secondary" style={{ fontSize: '0.75rem', margin: 0 }}>Painel da Liderança</p>
              <h2 className="logo-text" style={{ fontSize: '1.1rem', margin: 0 }}>Pr. Presidente</h2>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={`app-header ${location.pathname === '/culto' ? 'no-border' : ''}`} style={location.pathname === '/culto' ? { borderBottom: 'none', paddingBottom: 0 } : {}}>
      <div className="header-content">
        {backButton ? (
          <button className="icon-btn" aria-label="Voltar" onClick={() => navigate(-1)}>
            <i className="ph ph-caret-left"></i>
          </button>
        ) : (
          <div className="user-greeting" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/logo.jpeg" alt="Logo Foi Por Amor" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              {session ? (
                <>
                  <p className="text-secondary" style={{ fontSize: '0.75rem', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {periodo}, {session.nome?.split(' ')[0]}!
                  </p>
                  <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--text-muted)' }}>
                    Que Deus abençoe seu {periodo2}!
                  </p>
                </>
              ) : (
                <>
                  <p className="text-secondary" style={{ fontSize: '0.75rem', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {periodo}!
                  </p>
                  <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--text-muted)' }}>
                    Que Deus abençoe seu {periodo2}!
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {title && backButton && (
          <h2 className="logo-text" style={location.pathname === '/culto' ? { fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' } : {}}>{title}</h2>
        )}

        {title && backButton && <div style={{ width: '40px' }}></div>}

        {!backButton && (
          <div style={{ display: 'flex', gap: '4px', position: 'relative', alignItems: 'center' }}>
            {/* Toggle dark/light */}
            <button
              className="icon-btn"
              aria-label="Alternar tema"
              onClick={() => setDarkMode(d => !d)}
              title={darkMode ? 'Modo claro' : 'Modo escuro'}
            >
              <i className={`ph ${darkMode ? 'ph-sun' : 'ph-moon'}`}></i>
            </button>

            {/* Sino */}
            <div ref={sinoRef} style={{ position: 'relative' }}>
              <button
                className="icon-btn"
                aria-label="Notificações"
                onClick={() => { setSinoAberto(o => !o); if (!sinoAberto) { setNotificacoes(loadNotificacoes()); } }}
                style={{
                  position: 'relative',
                  ...(naoLidas > 0 && { color: 'var(--accent-color)' }),
                }}
              >
                <i className={`ph ${naoLidas > 0 ? 'ph-bell-ringing bell-ring' : 'ph-bell'}`}></i>
                {naoLidas > 0 && (
                  <span className="badge-notify" style={{ position: 'absolute', top: '4px', right: '4px', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', border: '1.5px solid var(--bg-color)' }} />
                )}
              </button>

              {sinoAberto && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, width: '300px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-md)', zIndex: 100, overflow: 'hidden' }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>Notificações</span>
                    {naoLidas > 0 && (
                      <button onClick={marcarTodasLidas} style={{ fontSize: '0.75rem', color: 'var(--accent-color)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                        Marcar como lido
                      </button>
                    )}
                  </div>

                  {notificacoes.length === 0 ? (
                    <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      <i className="ph ph-bell-slash" style={{ fontSize: '1.5rem', display: 'block', marginBottom: '8px' }}></i>
                      Nenhuma notificação
                    </div>
                  ) : (
                    notificacoes.map(n => (
                      <div key={n.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', background: n.lida ? 'transparent' : 'rgba(255,255,255,0.03)' }}>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          {!n.lida && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-color)', marginTop: '5px', flexShrink: 0 }} />}
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{n.titulo}</p>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{n.texto?.slice(0, 80)}{n.texto?.length > 80 ? '...' : ''}</p>
                            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>{n.data}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  <button
                    onClick={() => { setSinoAberto(false); navigate('/avisos'); }}
                    style={{ width: '100%', padding: '12px', background: 'none', border: 'none', borderTop: notificacoes.length > 0 ? '1px solid var(--border-color)' : 'none', color: 'var(--accent-color)', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
                  >
                    Ver todos os avisos
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/usuario')}
              className="icon-btn"
              aria-label="Usuário"
            >
              <i className="ph ph-user-circle"></i>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
