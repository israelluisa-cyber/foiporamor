import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { loadConfig, DIAS_ABBR, formatHora } from '../data/config';

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('user_session')); } catch { return null; }
}

const KEY = 'rsvp_eventos';

const FOTOS_PADRAO = {
  1: '/theology_course.png',
  2: '/hero_bg.png',
  3: '/offering_bg.png',
  4: '/hero_bg.png',
};

const OVERLAYS = {
  1: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.15) 100%)',
  2: 'linear-gradient(to top, rgba(30,0,70,0.82) 0%, rgba(0,0,0,0.15) 100%)',
  3: 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.15) 100%)',
  4: 'linear-gradient(to top, rgba(10,20,60,0.82) 0%, rgba(0,0,0,0.15) 100%)',
};

const LINKS = { 1: '/culto', 4: '/culto' };

function loadRsvp() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

export default function Programacao() {
  const config = loadConfig();
  const [rsvps, setRsvps] = useState(loadRsvp);
  const [toast, setToast] = useState('');
  const logado = !!getSession();

  const cultos = config.cultos.filter(cu => cu.ativo && (!cu.restrito || logado));

  const toggleRsvp = (id) => {
    const novos = rsvps.includes(id) ? rsvps.filter(r => r !== id) : [...rsvps, id];
    setRsvps(novos);
    localStorage.setItem(KEY, JSON.stringify(novos));
    if (!rsvps.includes(id)) setToast('Presença confirmada! Te esperamos.');
  };

  return (
    <div className="container">
      <Header title="Programação" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>
        <p className="text-secondary" style={{ marginBottom: 'var(--spacing-lg)' }}>
          Nossos encontros semanais. Venha adorar conosco!
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
          {cultos.map((cu) => {
            const foto = cu.foto || FOTOS_PADRAO[cu.id] || '/hero_bg.png';
            const overlay = OVERLAYS[cu.id] || 'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.15) 100%)';
            const link = LINKS[cu.id] || null;
            const diaAbr = DIAS_ABBR[cu.diaSemana];
            const horario = `${formatHora(cu.hora, cu.min)} às ${formatHora(cu.horaFim, cu.minFim)}`;

            return (
              <div key={cu.id} className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>

                {/* Banner */}
                <div style={{
                  height: '140px',
                  backgroundImage: `url(${foto})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative',
                }}>
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: overlay,
                    display: 'flex', alignItems: 'flex-end',
                    padding: '12px 14px',
                  }}>
                    <span style={{
                      background: 'var(--accent-color)', color: 'var(--bg-color)',
                      borderRadius: 'var(--radius-full)', padding: '3px 12px',
                      fontSize: '0.72rem', fontWeight: 700,
                      letterSpacing: '0.06em', textTransform: 'uppercase',
                    }}>
                      {diaAbr}
                    </span>
                  </div>
                </div>

                {/* Detalhes */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', padding: '12px 14px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 className="event-title" style={{ marginBottom: '4px' }}>{cu.nome}</h4>
                    <div className="event-time">
                      <i className="ph ph-clock"></i> {horario}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {link && (
                      <Link to={link} className="icon-btn" style={{ width: '34px', height: '34px' }}>
                        <i className="ph ph-play"></i>
                      </Link>
                    )}
                    {!cu.restrito && (
                      <button
                        onClick={() => toggleRsvp(cu.id)}
                        title={rsvps.includes(cu.id) ? 'Cancelar confirmação' : 'Confirmar presença'}
                        style={{
                          width: '34px', height: '34px', borderRadius: 'var(--radius-full)',
                          background: rsvps.includes(cu.id) ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
                          border: `1px solid ${rsvps.includes(cu.id) ? 'var(--accent-color)' : 'var(--border-color)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: rsvps.includes(cu.id) ? 'var(--bg-color)' : 'var(--text-secondary)',
                          fontSize: '1rem', transition: 'all 0.2s', cursor: 'pointer',
                        }}
                      >
                        <i className={`ph ${rsvps.includes(cu.id) ? 'ph-check' : 'ph-calendar-plus'}`}></i>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {rsvps.length > 0 && (
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: 'var(--spacing-md)' }}>
            <i className="ph ph-check-circle"></i> Você confirmou presença em {rsvps.length} evento{rsvps.length > 1 ? 's' : ''} desta semana.
          </p>
        )}
      </main>

      {toast && <Toast message={toast} icon="ph-calendar-check" type="success" onClose={() => setToast('')} />}
    </div>
  );
}
