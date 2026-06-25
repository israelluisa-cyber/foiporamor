import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import PixPanel from '../components/PixPanel';

function getSession() {
  try { return JSON.parse(sessionStorage.getItem('user_session')); }
  catch { return null; }
}

export default function Teologia() {
  const navigate = useNavigate();
  const session = getSession();

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
          <button
            onClick={() => navigate('/usuario')}
            className="primary-btn"
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <i className="ph ph-sign-in"></i>
            <span>Entrar como Membro</span>
          </button>
          <button
            onClick={() => navigate(-1)}
            style={{ marginTop: '12px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Voltar
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="ITEAP" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        <section className="glass-card hero-card" style={{ marginBottom: 'var(--spacing-md)', padding: 'var(--spacing-lg)' }}>
          <span className="hero-tag" style={{ marginBottom: '8px', display: 'inline-block' }}>Instituto Teológico</span>
          <h2 className="font-heading" style={{ fontSize: '1.4rem', marginBottom: '4px', lineHeight: 1.3 }}>ITEAP</h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Instituto Teológico Amor e Palavra</p>
          <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <i className="ph ph-users"></i>
              <span>23 Alunos</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <i className="ph ph-chalkboard-teacher"></i>
              <span>Pr. Luís Carlos Pedreira Marques</span>
            </div>
          </div>
        </section>

        <h3 className="section-title" style={{ marginTop: 0 }}>Disciplinas</h3>

        <div style={{ background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: 'var(--spacing-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ width: '100%', height: '140px', objectFit: 'cover', background: 'url(/theology_course.png) center/cover' }}></div>
          <div style={{ padding: 'var(--spacing-md)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>Módulo Atual</span>
            <h4 className="font-heading" style={{ fontSize: '1.2rem', margin: '4px 0' }}>Pneumatologia</h4>
            <p className="text-secondary" style={{ fontSize: '0.85rem' }}>Pr. Luís Carlos Pedreira Marques • 12 Aulas</p>

            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: 'var(--radius-full)', margin: '10px 0', overflow: 'hidden' }}>
              <div style={{ height: '100%', background: 'var(--accent-color)', borderRadius: 'var(--radius-full)', width: '40%' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
              <span>Progresso: 40%</span>
              <span>4/12 concluídas</span>
            </div>

            <button className="primary-btn" style={{ padding: '10px', display: 'flex', justifyContent: 'center' }}>
              <i className="ph ph-play-circle"></i> <span>Continuar Aula 5</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: 'var(--spacing-md)', marginTop: 'var(--spacing-sm)' }}>
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
          <PixPanel
            toastText="Chave PIX copiada! Aguarde a confirmação da secretaria."
          />
        </section>

      </main>
    </div>
  );
}
