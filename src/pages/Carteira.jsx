import { useState } from 'react';
import Header from '../components/Header';
import { loadConfig } from '../data/config';

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('user_session')); } catch { return null; }
}

function getInitials(nome) {
  if (!nome) return '?';
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

export default function Carteira() {
  const session = getSession();
  const config = loadConfig();
  const [virado, setVirado] = useState(false);

  const nome   = session?.nome  || `Membro ${config.nomeCurto}`;
  const cargo  = session?.cargo || 'Membro';
  const celula = session?.celula || '—';
  const desde  = session?.id ? new Date(parseInt(session.id)).getFullYear() : new Date().getFullYear();
  const codigo = session ? `${config.nomeCurto}-${String(session.id).slice(-6).toUpperCase()}` : `${config.nomeCurto}-XXXXXX`;

  if (!session) {
    return (
      <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
        <Header title="Carteira de Membro" backButton={true} />
        <main style={{ paddingTop: '60px', textAlign: 'center' }}>
          <i className="ph ph-identification-card" style={{ fontSize: '3rem', color: 'var(--text-muted)', display: 'block', marginBottom: '16px' }}></i>
          <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>Acesso restrito</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>Faça login para visualizar sua carteira de membro.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Carteira de Membro" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>
          Toque na carteira para ver o QR Code
        </p>

        {/* Carteira — frente/verso com flip */}
        <div
          onClick={() => setVirado(v => !v)}
          style={{ perspective: '1000px', cursor: 'pointer', marginBottom: 'var(--spacing-lg)' }}
        >
          <div style={{ position: 'relative', width: '100%', paddingBottom: '56%', transition: 'transform 0.6s', transformStyle: 'preserve-3d', transform: virado ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>

            {/* Frente */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 60%, #1c1c1c 100%)', border: '1px solid rgba(255,255,255,0.1)', padding: '20px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
              {/* Decoração */}
              <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
              <div style={{ position: 'absolute', bottom: '-20px', left: '10px', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', position: 'relative' }}>
                <div>
                  <p style={{ fontSize: '0.6rem', fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '2px' }}>{config.nomeIgreja}</p>
                  <p style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.5px' }}>Carteira de Membro</p>
                </div>
                <img src={config.logoUrl || '/logo-icon.png'} alt="Logo" style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.2)' }} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, color: '#fff' }}>{getInitials(nome)}</span>
                </div>
                <div>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '2px', lineHeight: 1.2 }}>{nome}</p>
                  <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>{cargo} · Desde {desde}</p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', position: 'relative' }}>
                <div>
                  <p style={{ fontSize: '0.55rem', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>Célula</p>
                  <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>{celula}</p>
                </div>
                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{codigo}</p>
              </div>
            </div>

            {/* Verso — QR Code */}
            <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', transform: 'rotateY(180deg)' }}>
              {/* QR code simulado */}
              <div style={{ width: '100px', height: '100px', background: '#fff', borderRadius: '8px', padding: '8px', display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: '2px' }}>
                {Array.from({ length: 49 }, (_, i) => (
                  <div key={i} style={{ background: [0,1,2,3,4,5,6,7,13,14,20,21,27,28,34,35,41,42,43,44,45,46,47,48,8,15,22,29,36,10,12,17,24,31,38].includes(i) ? '#000' : '#fff', borderRadius: '1px' }} />
                ))}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.4)', marginBottom: '2px' }}>Código de verificação</p>
                <p style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: 'rgba(255,255,255,0.7)', letterSpacing: '2px' }}>{codigo}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Info cards */}
        <section className="glass-card">
          {[
            { icon: 'ph-user', label: 'Nome', valor: nome },
            { icon: 'ph-briefcase', label: 'Cargo', valor: cargo },
            { icon: 'ph-users-three', label: 'Célula', valor: celula },
            { icon: 'ph-calendar-check', label: 'Membro desde', valor: desde },
          ].map(({ icon, label, valor }, i, arr) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < arr.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <i className={`ph ${icon}`} style={{ fontSize: '1.1rem', color: 'var(--text-muted)', width: '20px' }}></i>
              <div>
                <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, margin: 0 }}>{label}</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', margin: '2px 0 0 0' }}>{valor}</p>
              </div>
            </div>
          ))}
        </section>

        <p style={{ textAlign: 'center', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-md)' }}>
          Apresente esta carteira na entrada dos eventos da {config.nomeCurto}
        </p>
      </main>
    </div>
  );
}
