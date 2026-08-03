import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { loadConfig } from '../data/config';

function getSaudacao() {
  const h = new Date().getHours();
  if (h >= 6 && h < 12) return { periodo: 'Bom dia',    periodo2: 'seu dia'   };
  if (h >= 12 && h < 18) return { periodo: 'Boa tarde', periodo2: 'sua tarde' };
  return                         { periodo: 'Boa noite', periodo2: 'sua noite' };
}

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('user_session')); }
  catch { return null; }
}

function getFotoMembro(session) {
  if (!session) return null;
  try {
    const cadastros = JSON.parse(localStorage.getItem('cadastros_pendentes')) || [];
    return cadastros.find(c => c.id === session.id)?.foto || null;
  } catch { return null; }
}

function isAniversario(dataNascimento) {
  if (!dataNascimento) return false;
  const hoje = new Date();
  const [, mes, dia] = dataNascimento.split('-').map(Number);
  return hoje.getDate() === dia && hoje.getMonth() + 1 === mes;
}

export default function Header({ title, backButton = false, admin = false }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { periodo, periodo2 } = getSaudacao();
  const session = getSession();
  const config = loadConfig();

  const aniversario  = session ? isAniversario(session.dataNascimento) : false;
  const fotoMembro   = getFotoMembro(session);

  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return true;
  });

  useEffect(() => {
    document.body.classList.toggle('light', !darkMode);
    localStorage.setItem('theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  if (admin) {
    return (
      <header className="app-header">
        <div className="header-content">
          <div className="user-greeting" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={config.logoUrl || '/logo-icon.png'} alt={config.nomeIgreja} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              <p className="text-secondary" style={{ fontSize: '0.75rem', margin: 0 }}>Painel da Liderança</p>
              <h2 className="logo-text" style={{ fontSize: '1.1rem', margin: 0 }}>Pr. Presidente</h2>
            </div>
          </div>
        </div>
      </header>
    );
  }

  const isHome = location.pathname === '/';

  return (
    <header
      className={`app-header ${location.pathname === '/culto' ? 'no-border' : ''} ${isHome ? 'app-header-transparent' : ''}`}
      style={location.pathname === '/culto' ? { borderBottom: 'none', paddingBottom: 0 } : {}}
    >
      <div className="header-content">
        {backButton ? (
          <button
            className="icon-btn"
            aria-label="Voltar"
            onClick={() => {
              if (window.history.state?.idx > 0) navigate(-1);
              else navigate('/');
            }}
          >
            <i className="ph ph-caret-left"></i>
          </button>
        ) : (
          <div className="user-greeting" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src={config.logoUrl || '/logo-icon.png'} alt={config.nomeIgreja} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
            <div>
              {session ? (
                <>
                  <p className="text-secondary" style={{ fontSize: '0.75rem', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {aniversario ? `Feliz Aniversário, ${session.nome?.split(' ')[0]}! 🎂` : `${periodo}, ${session.nome?.split(' ')[0]}!`}
                  </p>
                  <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--text-muted)' }}>
                    {aniversario ? 'Que Deus abençoe sua vida!' : `Que Deus abençoe ${periodo2}!`}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-secondary" style={{ fontSize: '0.75rem', margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                    {periodo}!
                  </p>
                  <p style={{ fontSize: '0.7rem', margin: 0, color: 'var(--text-muted)' }}>
                    Que Deus abençoe {periodo2}!
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
              className="icon-btn theme-toggle"
              aria-label="Alternar tema"
              onClick={() => setDarkMode(d => !d)}
              title={darkMode ? 'Modo claro' : 'Modo escuro'}
            >
              <i className={`ph ${darkMode ? 'ph-sun' : 'ph-moon'}`}></i>
            </button>

            <button
              onClick={() => navigate('/usuario')}
              className="icon-btn"
              aria-label="Usuário"
              style={{ padding: 0, overflow: 'hidden' }}
            >
              {fotoMembro ? (
                <img src={fotoMembro} alt="Perfil" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-full)' }} />
              ) : (
                <i className="ph ph-user-circle"></i>
              )}
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
