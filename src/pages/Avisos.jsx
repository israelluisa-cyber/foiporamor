import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { loadConfig } from '../data/config';
import { TIPO_CORES, loadAvisosValidos, marcarAvisosComoLidos } from '../data/avisos';

export default function Avisos() {
  const [filtro, setFiltro] = useState('Todos');
  const [expandido, setExpandido] = useState(null);
  const config = loadConfig();

  const todosAvisos = loadAvisosValidos();

  // Roda só uma vez, ao abrir a tela: marca como lidos os avisos que estavam
  // válidos nesse momento. Não deve rodar de novo a cada re-render (troca de
  // filtro, por exemplo), então a lista de dependências fica vazia de propósito.
  useEffect(() => {
    marcarAvisosComoLidos(todosAvisos);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtrados = (filtro === 'Todos' ? todosAvisos : todosAvisos.filter(a => a.tipo === filtro)).slice(0, 5);

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Avisos" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-lg)', overflowX: 'auto', paddingBottom: '4px', scrollbarWidth: 'none' }}>
          {['Todos', 'Urgente', 'Evento', 'Informativo'].map(f => (
            <button key={f} onClick={() => setFiltro(f)} style={{
              whiteSpace: 'nowrap', padding: '7px 16px', borderRadius: 'var(--radius-full)',
              background: filtro === f ? 'var(--accent-color)' : 'var(--bg-surface)',
              color: filtro === f ? 'var(--bg-color)' : 'var(--text-secondary)',
              border: `1px solid ${filtro === f ? 'var(--accent-color)' : 'var(--border-color)'}`,
              fontSize: '0.82rem', fontWeight: filtro === f ? 700 : 400, transition: 'all 0.2s',
            }}>
              {f}
            </button>
          ))}
        </div>

        {filtrados.map((aviso) => {
          const cor = TIPO_CORES[aviso.tipo];
          const aberto = expandido === aviso.id;
          return (
            <div
              key={aviso.id}
              onClick={() => setExpandido(aberto ? null : aviso.id)}
              style={{
                background: cor.bg, border: `1px solid ${cor.border}`,
                borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)',
                marginBottom: '10px', cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ph ${aviso.icone}`} style={{ fontSize: '1.2rem', color: cor.text }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '0.68rem', color: cor.text, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>{aviso.tipo}</span>
                      <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', color: 'var(--text-primary)', margin: '2px 0' }}>{aviso.titulo}</h4>
                    </div>
                    <i className={`ph ${aberto ? 'ph-caret-up' : 'ph-caret-down'}`} style={{ color: 'var(--text-muted)', flexShrink: 0, marginTop: '2px' }}></i>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{aviso.data}</p>
                  {aberto && (
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '10px', lineHeight: 1.6, animation: 'fadeIn 0.2s ease' }}>
                      {aviso.texto}
                    </p>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtrados.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            <i className="ph ph-bell-slash" style={{ fontSize: '2.5rem', display: 'block', marginBottom: '12px' }}></i>
            <p>Nenhum aviso no momento.</p>
          </div>
        )}

        {/* ── Redes Sociais ───────────────────────────── */}
        <div style={{ marginTop: 'var(--spacing-xl)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-md)' }}>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', whiteSpace: 'nowrap' }}>Nos siga nas redes</span>
            <div style={{ flex: 1, height: '1px', background: 'var(--border-color)' }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[
              {
                nome: 'YouTube',
                handle: 'Ver canal',
                url: config.youtubeLink,
                gradient: 'linear-gradient(135deg, #c4302b, #ff6347)',
                icon: 'ph-youtube-logo',
              },
              {
                nome: 'Instagram',
                handle: 'Seguir no Instagram',
                url: config.instagramLink,
                gradient: 'linear-gradient(135deg, #833ab4, #fd1d1d, #f77737)',
                icon: 'ph-instagram-logo',
              },
              {
                nome: 'Facebook',
                handle: 'Seguir no Facebook',
                url: config.facebookLink,
                gradient: 'linear-gradient(135deg, #1877f2, #0c5ebf)',
                icon: 'ph-facebook-logo',
              },
            ].filter(rede => rede.url).map(rede => (
              <button
                key={rede.nome}
                onClick={() => window.open(rede.url, '_blank')}
                style={{
                  width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)', padding: '14px 16px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '14px', transition: 'all 0.2s',
                  textAlign: 'left',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}
              >
                <div style={{
                  width: '46px', height: '46px', borderRadius: 'var(--radius-md)', flexShrink: 0,
                  background: rede.gradient, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                }}>
                  <i className={`ph ${rede.icon}`} style={{ fontSize: '1.4rem', color: '#fff' }}></i>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)', margin: 0 }}>{rede.nome}</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{rede.handle}</p>
                </div>
                <i className="ph ph-arrow-square-out" style={{ fontSize: '1.1rem', color: 'var(--text-muted)', flexShrink: 0 }}></i>
              </button>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
