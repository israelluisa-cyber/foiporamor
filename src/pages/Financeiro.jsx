import { useRef } from 'react';
import Header from '../components/Header';
import PixPanel from '../components/PixPanel';
import { loadConfig } from '../data/config';
import { loadContribuicoes, saveContribuicao } from '../data/contribuicoes';

function parseBRL(str) {
  return parseFloat((str || '').replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
}

export default function Financeiro() {
  const config = loadConfig();
  const obras  = config.obras || [];
  const pixRef = useRef(null);

  const STATS = [
    { icon: 'ph-hands-heart',    valor: '4',      label: 'Obras sociais'    },
    { icon: 'ph-bowl-food',      valor: '2.400+', label: 'Marmitas doadas'  },
    { icon: 'ph-calendar-check', valor: '5 anos', label: 'De missão social' },
  ];

  const handleContribuir = () => {
    setTimeout(() => {
      pixRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handlePixSuccess = ({ valor }) => {
    const valorNum = parseBRL(valor);
    saveContribuicao({ tipo: 'Contribuição Geral', valorNum, valorFormatado: valor });
  };

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(32px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes gradientShift {
          0%   { background-position: 0% 50%;   }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%;   }
        }
        .obra-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .obra-card:active { transform: scale(0.985); }
        .contrib-btn { transition: all 0.2s ease; }
        .contrib-btn:active { transform: scale(0.97); filter: brightness(1.1); }
      `}</style>

      <Header title="Contribuições" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* ── Hero ──────────────────────────────────── */}
        <section style={{
          position: 'relative', borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          marginBottom: 'var(--spacing-lg)', padding: '28px 20px 24px',
          background: 'linear-gradient(135deg, #1a0533 0%, #3b0764 40%, #1e1b4b 100%)',
          backgroundSize: '200% 200%',
          animation: 'gradientShift 8s ease infinite',
        }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '-20px', left: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />

          <div style={{ position: 'relative', zIndex: 1, animation: 'fadeInUp 0.6s ease both' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '2px' }}>Igreja Foi Por Amor</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.7rem', color: '#fff', margin: '6px 0 8px', lineHeight: 1.2 }}>
              Uma igreja transformando<br />vidas pelo amor de Jesus Cristo
            </h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, marginBottom: '20px' }}>
              "Deus ama quem dá com alegria." — 2 Co 9:7
            </p>

            <div style={{ display: 'flex', gap: '10px' }}>
              {STATS.map((s, i) => (
                <div key={i} style={{ flex: 1, background: 'rgba(255,255,255,0.08)', borderRadius: 'var(--radius-md)', padding: '10px 8px', textAlign: 'center', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <i className={`ph ${s.icon}`} style={{ fontSize: '1.1rem', color: 'rgba(255,255,255,0.8)', display: 'block', marginBottom: '4px' }}></i>
                  <p style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>{s.valor}</p>
                  <p style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.55)', margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Obras Sociais ─────────────────────────── */}
        <h3 className="section-title" style={{ marginTop: 0 }}>Nossas Obras Sociais</h3>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-lg)', lineHeight: 1.6 }}>
          Sua contribuição é dividida entre todas as causas abaixo, multiplicando o impacto do seu amor.
        </p>

        {obras.map((obra, idx) => (
          <div
            key={obra.id}
            className="obra-card"
            style={{
              marginBottom: 'var(--spacing-lg)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--border-color)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
              animation: `fadeInUp 0.5s ease both`,
              animationDelay: `${idx * 0.1}s`,
            }}
          >
            {/* Banner */}
            <div style={{ position: 'relative', width: '100%', height: '210px' }}>
              {obra.foto ? (
                <img src={obra.foto} alt={obra.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: obra.gradiente, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '2px solid rgba(255,255,255,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                    <i className={`ph ${obra.icone}`} style={{ fontSize: '2.2rem', color: '#fff' }}></i>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1.5px' }}>foto em breve</span>
                </div>
              )}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)', padding: '40px 18px 16px' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.25rem', color: '#fff', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>{obra.nome}</h3>
              </div>
            </div>

            {/* Corpo do card */}
            <div style={{ padding: '18px', background: 'var(--bg-surface)' }}>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '16px' }}>
                {obra.descricao}
              </p>
              <button
                className="contrib-btn"
                onClick={handleContribuir}
                style={{
                  width: '100%', padding: '13px', background: obra.gradiente,
                  border: 'none', borderRadius: 'var(--radius-md)', color: '#fff',
                  fontWeight: 700, fontSize: '0.92rem', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                }}
              >
                <i className="ph ph-hand-coins"></i>
                Contribuir
              </button>
            </div>
          </div>
        ))}

        {/* ── Seção PIX ─────────────────────────────── */}
        <div ref={pixRef} style={{ scrollMarginTop: '16px', animation: 'fadeIn 0.4s ease both' }}>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: 'var(--spacing-md)' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ph ph-key" style={{ fontSize: '1.2rem', color: '#fff' }}></i>
            </div>
            <div>
              <h3 className="font-heading" style={{ fontSize: '1.05rem', margin: 0 }}>Faça sua Contribuição</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>Via PIX · dividido entre todas as causas</p>
            </div>
          </div>

          <section className="glass-card" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}>
            <PixPanel
              tipo="Contribuição Geral"
              toastText="Chave PIX copiada! Que Deus multiplique sua oferta."
              onSuccess={handlePixSuccess}
            />
          </section>

          <div style={{ marginTop: 'var(--spacing-md)', padding: '14px 16px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <i className="ph ph-shield-check" style={{ fontSize: '1.1rem', color: 'var(--text-muted)', flexShrink: 0, marginTop: '1px' }}></i>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
              Todas as contribuições são divididas entre as obras sociais e gerenciadas com total transparência pela liderança da Igreja Foi Por Amor. Prestações de contas são apresentadas periodicamente à congregação.
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
