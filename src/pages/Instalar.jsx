import { useState } from 'react';
import Header from '../components/Header';

const APP_URL = 'https://foiporamor.vercel.app';
const QR_URL  = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=ffffff&bgcolor=0d0d0d&data=${encodeURIComponent(APP_URL)}`;

export default function Instalar() {
  const [copiado, setCopiado] = useState(false);

  const copiarLink = () => {
    navigator.clipboard.writeText(APP_URL).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Baixar App" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* QR Code */}
        <section className="glass-card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>
            Escaneie para acessar
          </p>
          <div style={{ display: 'inline-block', padding: '16px', background: '#0d0d0d', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <img src={QR_URL} alt="QR Code do App" width={220} height={220} style={{ display: 'block', borderRadius: '8px' }} />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Igreja Foi Por Amor</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '20px' }}>{APP_URL}</p>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={copiarLink}
              className="primary-btn"
              style={{ flex: 1, justifyContent: 'center', background: copiado ? 'rgba(34,197,94,0.15)' : 'var(--bg-surface-elevated)', color: copiado ? '#22c55e' : 'var(--text-primary)', border: `1px solid ${copiado ? 'rgba(34,197,94,0.3)' : 'var(--border-color)'}` }}
            >
              <i className={`ph ${copiado ? 'ph-check' : 'ph-copy'}`}></i>
              {copiado ? 'Copiado!' : 'Copiar link'}
            </button>
            <a
              href={APP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="primary-btn"
              style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}
            >
              <i className="ph ph-arrow-square-out"></i>
              Abrir app
            </a>
          </div>
        </section>

        {/* Instruções Android */}
        <h3 className="section-title">Como instalar no celular</h3>

        <section className="glass-card" style={{ marginBottom: 'var(--spacing-md)', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, #4ade80, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ph ph-android-logo" style={{ fontSize: '1.2rem', color: '#fff' }}></i>
            </div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Android (Chrome)</p>
          </div>
          {[
            { n: 1, txt: 'Abra o link no Chrome' },
            { n: 2, txt: 'Toque nos 3 pontinhos (⋮) no canto superior direito' },
            { n: 3, txt: 'Selecione "Adicionar à tela inicial"' },
            { n: 4, txt: 'Confirme tocando em "Adicionar"' },
          ].map(({ n, txt }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--bg-color)' }}>{n}</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{txt}</p>
            </div>
          ))}
        </section>

        {/* Instruções iPhone */}
        <section className="glass-card" style={{ marginBottom: 'var(--spacing-lg)', padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, #818cf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <i className="ph ph-apple-logo" style={{ fontSize: '1.2rem', color: '#fff' }}></i>
            </div>
            <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>iPhone (Safari)</p>
          </div>
          {[
            { n: 1, txt: 'Abra o link no Safari (não funciona no Chrome do iPhone)' },
            { n: 2, txt: 'Toque no ícone de compartilhar (□↑) na barra inferior' },
            { n: 3, txt: 'Role para baixo e toque em "Adicionar à Tela de Início"' },
            { n: 4, txt: 'Confirme tocando em "Adicionar"' },
          ].map(({ n, txt }) => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--bg-color)' }}>{n}</span>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>{txt}</p>
            </div>
          ))}
        </section>

        {/* Rodapé */}
        <section className="glass-card word-card" style={{ textAlign: 'center' }}>
          <i className="ph ph-church" style={{ fontSize: '1.8rem', color: 'var(--accent-color)', display: 'block', marginBottom: '8px' }}></i>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Compartilhe com outros membros e visitantes da <strong>Igreja Foi Por Amor</strong>. Quanto mais pessoas conectadas, mais forte nossa comunidade!
          </p>
        </section>

      </main>
    </div>
  );
}
