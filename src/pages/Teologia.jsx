import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PixPanel from '../components/PixPanel';
import { loadConfig } from '../data/config';
import { loadTeologia } from '../data/teologia';

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('user_session')); }
  catch { return null; }
}

const STATUS_STYLE = {
  concluido:  { color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  icon: 'ph-check-circle',  label: 'Concluído'    },
  andamento:  { color: '#fff',    bg: 'rgba(255,255,255,0.1)', icon: 'ph-book-open',      label: 'Em andamento' },
  bloqueado:  { color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: 'ph-lock',           label: 'Em breve'     },
};

export default function Teologia() {
  const navigate = useNavigate();
  const session  = getSession();
  const config   = loadConfig();
  const teologia = loadTeologia();

  if (!session) {
    return (
      <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
        <Header title="ITEAP" backButton={true} />
        <main style={{ paddingTop: 'var(--spacing-xl)', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: 'var(--spacing-xl) var(--spacing-md)' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'var(--spacing-lg)' }}>
            <i className="ph ph-lock" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}></i>
          </div>
          <h2 className="font-heading" style={{ marginBottom: '8px' }}>Área Exclusiva para Membros</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 'var(--spacing-lg)', maxWidth: '320px' }}>
            O Instituto Teológico ITEAP é acessível apenas para membros cadastrados e aprovados da Igreja Foi Por Amor.
          </p>
          <button onClick={() => navigate('/usuario')} className="primary-btn" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <i className="ph ph-sign-in"></i>
            <span>Entrar como Membro</span>
          </button>
          <button onClick={() => navigate(-1)} style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}>
            Voltar
          </button>
        </main>
      </div>
    );
  }

  const modulos      = teologia.modulos || [];
  const idxAtual     = teologia.moduloAtualIdx ?? 0;
  const moduloAtual  = modulos[idxAtual];
  const progresso    = moduloAtual ? Math.min(100, Math.round((teologia.progressoAulas / moduloAtual.totalAulas) * 100)) : 0;
  const proximaAula  = Math.min((teologia.progressoAulas || 0) + 1, moduloAtual?.totalAulas || 1);

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="ITEAP" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* ── Hero ── */}
        <section style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #1e3a5f 100%)',
          borderRadius: 'var(--radius-lg)', padding: 'var(--spacing-lg)',
          marginBottom: 'var(--spacing-lg)', position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
          <div style={{ position: 'absolute', bottom: '-20px', left: '20px', width: '90px', height: '90px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />

          <div style={{ position: 'relative' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
              <i className="ph ph-graduation-cap" style={{ fontSize: '1.6rem', color: '#fff' }}></i>
            </div>
            <h2 className="font-heading" style={{ fontSize: '1.6rem', color: '#fff', margin: '0 0 4px' }}>ITEAP</h2>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginBottom: '16px' }}>{teologia.descricao}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                <i className="ph ph-chalkboard-teacher"></i>
                <span>{teologia.professor}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)' }}>
                <i className="ph ph-books"></i>
                <span>{modulos.length} módulos</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── Progresso atual ── */}
        {moduloAtual && (
          <>
            <h3 className="section-title">Meu Progresso</h3>
            <section className="glass-card" style={{ marginBottom: 'var(--spacing-lg)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ph ph-book-open" style={{ fontSize: '1.2rem', color: 'var(--accent-color)' }}></i>
                </div>
                <div>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px', margin: 0 }}>Módulo Atual</p>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '2px 0 0' }}>{moduloAtual.nome}</p>
                </div>
              </div>

              <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)', overflow: 'hidden', marginBottom: '6px' }}>
                <div style={{ height: '100%', background: 'var(--accent-color)', borderRadius: 'var(--radius-full)', width: `${progresso}%`, transition: 'width 0.5s ease' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                <span>Progresso: {progresso}%</span>
                <span>{teologia.progressoAulas}/{moduloAtual.totalAulas} aulas</span>
              </div>

              <button
                className="primary-btn"
                style={{ width: '100%', justifyContent: 'center', gap: '8px' }}
                onClick={() => window.open(config.youtubeLink || 'https://youtube.com', '_blank')}
              >
                <i className="ph ph-play-circle"></i>
                Continuar — Aula {proximaAula}
              </button>
            </section>
          </>
        )}

        {/* ── Módulos ── */}
        <h3 className="section-title">Módulos do Curso</h3>
        <section className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 'var(--spacing-lg)' }}>
          {modulos.map((mod, i) => {
            const statusKey = i < idxAtual ? 'concluido' : i === idxAtual ? 'andamento' : 'bloqueado';
            const s = STATUS_STYLE[statusKey];
            return (
              <div key={mod.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px var(--spacing-md)', borderBottom: i < modulos.length - 1 ? '1px solid var(--border-color)' : 'none', background: i === idxAtual ? 'rgba(255,255,255,0.03)' : 'transparent' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-sm)', background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`ph ${s.icon}`} style={{ fontSize: '1.1rem', color: s.color }}></i>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '0.92rem', fontWeight: i === idxAtual ? 700 : 500, color: i === idxAtual ? 'var(--text-primary)' : i < idxAtual ? 'var(--text-secondary)' : 'var(--text-muted)', margin: 0 }}>{mod.nome}</p>
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>{mod.totalAulas} aulas</p>
                </div>
                <span style={{ fontSize: '0.65rem', fontWeight: 700, color: s.color, background: s.bg, padding: '3px 8px', borderRadius: 'var(--radius-full)', whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </section>

        {/* ── Mensalidade ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-md)' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ph ph-currency-circle-dollar" style={{ fontSize: '1.2rem' }}></i>
          </div>
          <div>
            <h3 className="font-heading" style={{ fontSize: '1.1rem', margin: 0 }}>Mensalidade ITEAP</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0 }}>Pagamento via PIX • Aprovação imediata</p>
          </div>
        </div>
        <section className="glass-card">
          <p className="text-secondary" style={{ fontSize: '0.85rem', marginBottom: 'var(--spacing-md)' }}>
            Realize o pagamento da mensalidade do ITEAP via PIX.
          </p>
          <PixPanel toastText="Chave PIX copiada! Aguarde a confirmação da secretaria." />
        </section>

      </main>
    </div>
  );
}
