import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Toast from '../components/Toast';

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('user_session')); } catch { return null; }
}

const KEY = 'rsvp_eventos';

const EVENTOS = [
  { id: 'ter', dia: 'Ter', nome: 'Curso de Teologia', horario: '19:30 às 21:00', link: '/culto', restrito: false },
  { id: 'qui', dia: 'Qui', nome: 'Oração e Adoração',    horario: '19:30 às 21:00', link: null,    restrito: false },
  { id: 'sex', dia: 'Sex', nome: 'Ensaio do Louvor',     horario: '19:30 às 21:00', link: null,    restrito: true  },
  { id: 'dom', dia: 'Dom', nome: 'Culto de Celebração',  horario: '10:00 às 12:00', link: '/culto', restrito: false },
];

function loadRsvp() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

export default function Programacao() {
  const [rsvps, setRsvps] = useState(loadRsvp);
  const [toast, setToast] = useState('');
  const logado = !!getSession();
  const eventosFiltrados = EVENTOS.filter(ev => !ev.restrito || logado);

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
        <p className="text-secondary" style={{ marginBottom: 'var(--spacing-lg)' }}>Nossos encontros semanais. Venha adorar conosco!</p>

        <section className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {eventosFiltrados.map((ev, i) => (
            <div key={ev.id} style={{ borderBottom: i < eventosFiltrados.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <div className="event-list-item" style={{ padding: 'var(--spacing-md)' }}>
                <div className="event-day">
                  <span className="event-day-name">{ev.dia}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 className="event-title">{ev.nome}</h4>
                  <div className="event-time">
                    <i className="ph ph-clock"></i> {ev.horario}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                  {ev.link && (
                    <Link to={ev.link} className="icon-btn" style={{ width: '34px', height: '34px' }}>
                      <i className="ph ph-play"></i>
                    </Link>
                  )}
                  {!ev.restrito && (
                    <button
                      onClick={() => toggleRsvp(ev.id)}
                      title={rsvps.includes(ev.id) ? 'Cancelar confirmação' : 'Confirmar presença'}
                      style={{
                        width: '34px', height: '34px', borderRadius: 'var(--radius-full)',
                        background: rsvps.includes(ev.id) ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
                        border: `1px solid ${rsvps.includes(ev.id) ? 'var(--accent-color)' : 'var(--border-color)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: rsvps.includes(ev.id) ? 'var(--bg-color)' : 'var(--text-secondary)',
                        fontSize: '1rem', transition: 'all 0.2s',
                      }}
                    >
                      <i className={`ph ${rsvps.includes(ev.id) ? 'ph-check' : 'ph-calendar-plus'}`}></i>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>

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
