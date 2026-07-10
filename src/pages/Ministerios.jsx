import { useState } from 'react';
import Header from '../components/Header';
import { loadMinisterios } from '../data/ministeriosData';

function Emblema({ icon, gradient, glow, ring, foto, size = 76 }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div style={{ position: 'absolute', inset: '-6px', borderRadius: '50%', border: `2px solid ${ring}`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: '-2px', borderRadius: '50%', border: `1px solid ${ring.replace('0.45', '0.2')}`, pointerEvents: 'none' }} />
      {foto ? (
        <div style={{ width: size, height: size, borderRadius: '50%', backgroundImage: `url(${foto})`, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: `0 6px 24px ${glow}` }} />
      ) : (
        <div style={{ width: size, height: size, borderRadius: '50%', background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 24px ${glow}, 0 2px 8px rgba(0,0,0,0.5)`, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(255,255,255,0.12)', pointerEvents: 'none' }} />
          <i className={`ph ${icon}`} style={{ fontSize: size * 0.38, color: '#fff', position: 'relative', zIndex: 1 }} />
        </div>
      )}
      <div style={{ position: 'absolute', bottom: '-3px', right: '-3px', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--bg-surface)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', color: 'var(--text-muted)' }}>
        ✝
      </div>
    </div>
  );
}

function ModalMinisterio({ ministerio, onClose }) {
  if (!ministerio) return null;
  const sn = ministerio.sobreNos || {};
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: '600px', background: 'var(--bg-color)', borderRadius: '20px 20px 0 0', maxHeight: '90vh', overflow: 'auto', animation: 'slideUp 0.3s ease', position: 'relative' }}
      >
        {/* Header com gradiente */}
        <div style={{ background: ministerio.gradient, padding: '28px 20px 20px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative', zIndex: 1 }}>
            <Emblema icon={ministerio.icon} gradient={ministerio.gradient} glow={ministerio.glow} ring={ministerio.ring} foto={ministerio.foto} size={72} />
            <div>
              <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '1px' }}>{ministerio.tag}</span>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: '4px 0 0', lineHeight: 1.2 }}>{ministerio.nome}</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <i className="ph ph-users-three" style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}></i>
                <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{ministerio.membros} membros</span>
              </div>
            </div>
          </div>
        </div>

        {/* Botão voltar — mesmo padrão do Header (caret-left), acima do conteúdo scrollável */}
        <button
          onClick={onClose}
          aria-label="Voltar"
          style={{ position: 'absolute', top: '14px', left: '14px', zIndex: 100, background: 'rgba(0,0,0,0.40)', border: 'none', borderRadius: '50%', width: '34px', height: '34px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <i className="ph ph-caret-left" style={{ fontSize: '1rem' }}></i>
        </button>

        <div style={{ padding: '20px' }}>
          {/* Sobre Nós */}
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
              <i className="ph ph-info" style={{ marginRight: '6px' }}></i>SOBRE NÓS
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
              {sn.resumo || ministerio.descricao}
            </p>
          </div>

          {/* Atividades */}
          {sn.atividades && sn.atividades.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                <i className="ph ph-check-circle" style={{ marginRight: '6px' }}></i>O QUE FAZEMOS
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {sn.atividades.map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: ministerio.glow, border: `1px solid ${ministerio.ring}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                      <i className="ph ph-check" style={{ fontSize: '0.65rem', color: '#fff' }}></i>
                    </div>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>{a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Visão */}
          {sn.visao && (
            <div style={{ marginBottom: '20px', padding: '14px 16px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', borderLeft: `3px solid ${ministerio.glow}` }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
                <i className="ph ph-eye" style={{ marginRight: '5px' }}></i>NOSSA VISÃO
              </p>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
                "{sn.visao}"
              </p>
            </div>
          )}

          {/* Líderes */}
          {ministerio.lideres && ministerio.lideres.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '10px' }}>
                <i className="ph ph-crown" style={{ marginRight: '6px' }}></i>LIDERANÇA
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {ministerio.lideres.map((lider, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: ministerio.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {lider.foto ? (
                        <img src={lider.foto} alt={lider.nome} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#fff' }}>
                          {lider.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{lider.nome}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Líder do ministério</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ height: '16px' }} />
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default function Ministerios() {
  const ministerios = loadMinisterios().filter(m => m.ativo !== false);
  const total = ministerios.reduce((s, m) => s + (m.membros || 0), 0);
  const [selecionado, setSelecionado] = useState(null);

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Ministérios" backButton={true} />
      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Hero */}
        <section style={{ marginBottom: 'var(--spacing-lg)', background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 60%, #1e1b4b 100%)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 'var(--radius-lg)', padding: '28px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-40px', left: '50%', transform: 'translateX(-50%)', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(139,92,246,0.2)', border: '2px solid rgba(139,92,246,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', position: 'relative', zIndex: 1 }}>
            <i className="ph ph-church" style={{ fontSize: '2rem', color: '#a78bfa' }} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginBottom: '8px', fontFamily: 'var(--font-heading)', position: 'relative', zIndex: 1, letterSpacing: '1px' }}>
            MINISTÉRIOS
          </h1>
          <p style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, position: 'relative', zIndex: 1, marginBottom: '16px' }}>
            Toque em um ministério para saber mais sobre ele.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', position: 'relative', zIndex: 1 }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a78bfa', margin: 0 }}>{ministerios.length}</p>
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>ministérios</p>
            </div>
            <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: '#a78bfa', margin: 0 }}>{total}</p>
              <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>membros ativos</p>
            </div>
          </div>
        </section>

        {/* Lista */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {ministerios.map(m => (
            <button
              key={m.id}
              onClick={() => setSelecionado(m)}
              className="glass-card"
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', margin: 0, width: '100%', textAlign: 'left', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', cursor: 'pointer', color: 'var(--text-primary)', transition: 'border-color 0.2s' }}
            >
              <Emblema icon={m.icon} gradient={m.gradient} glow={m.glow} ring={m.ring} foto={m.foto} size={76} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px', flexWrap: 'wrap' }}>
                  <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>{m.nome}</p>
                  <span style={{ fontSize: '0.58rem', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
                    {m.tag}
                  </span>
                </div>
                <p style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 8px', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {m.descricao}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <div style={{ display: 'flex' }}>
                      {Array.from({ length: Math.min(m.membros, 4) }).map((_, i) => (
                        <div key={i} style={{ width: '20px', height: '20px', borderRadius: '50%', background: `hsl(${(i * 70 + 180) % 360}, 55%, 40%)`, border: '2px solid var(--bg-surface)', marginLeft: i === 0 ? 0 : '-6px', zIndex: 4 - i }} />
                      ))}
                      {m.membros > 4 && (
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--bg-surface-elevated)', border: '2px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.48rem', color: 'var(--text-muted)', fontWeight: 700, marginLeft: '-6px' }}>
                          +{m.membros - 4}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize: '0.73rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{m.membros} membros</span>
                  </div>
                  <i className="ph ph-caret-right" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}></i>
                </div>
              </div>
            </button>
          ))}
        </div>

      </main>

      {selecionado && (
        <ModalMinisterio ministerio={selecionado} onClose={() => setSelecionado(null)} />
      )}
    </div>
  );
}
