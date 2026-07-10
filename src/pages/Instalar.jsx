import { useState, useEffect } from 'react';
import Header from '../components/Header';
import { loadConfig } from '../data/config';

const APP_URL = window.location.origin;
const QR_URL  = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=ffffff&bgcolor=0d0d0d&data=${encodeURIComponent(APP_URL + '/instalar')}`;

function detectar() {
  const ua = navigator.userAgent || '';
  const isIOS      = /iphone|ipad|ipod/i.test(ua);
  const isChrome   = /crios|chrome/i.test(ua);
  const isSafari   = /safari/i.test(ua) && !isChrome;
  const isAndroid  = /android/i.test(ua);
  const isIOSChrome = isIOS && isChrome;
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  return { isIOS, isSafari, isAndroid, isIOSChrome, isInstalled };
}

export default function Instalar() {
  const [copiado, setCopiado]       = useState(false);
  const [podInstalar, setPodInstalar] = useState(false);
  const [instalado, setInstalado]   = useState(false);
  const { isIOS, isAndroid, isIOSChrome, isInstalled } = detectar();
  const config = loadConfig();

  useEffect(() => {
    if (isInstalled) { setInstalado(true); return; }
    if (window._installPrompt) setPodInstalar(true);
    const handler = () => setPodInstalar(true);
    window.addEventListener('beforeinstallprompt-ready', handler);
    return () => window.removeEventListener('beforeinstallprompt-ready', handler);
  }, []);

  const handleInstalar = async () => {
    if (!window._installPrompt) return;
    window._installPrompt.prompt();
    const { outcome } = await window._installPrompt.userChoice;
    if (outcome === 'accepted') { setInstalado(true); setPodInstalar(false); }
  };

  const copiarLink = () => {
    navigator.clipboard.writeText(APP_URL).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  };

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Instalar App" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Aviso: iPhone com Chrome */}
        {isIOSChrome && (
          <section style={{ marginBottom: 'var(--spacing-lg)', padding: '16px', background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.35)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <i className="ph ph-warning" style={{ fontSize: '1.4rem', color: '#fb923c', flexShrink: 0, marginTop: '2px' }}></i>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fb923c', marginBottom: '6px' }}>
                Você está usando o Chrome no iPhone
              </p>
              <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '10px' }}>
                No iPhone, a instalação do app só funciona pelo <strong>Safari</strong>. Copie o link abaixo e abra no Safari para continuar.
              </p>
              <button
                onClick={() => { navigator.clipboard.writeText(APP_URL + '/instalar'); setCopiado(true); setTimeout(() => setCopiado(false), 2000); }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#fb923c', border: 'none', borderRadius: 'var(--radius-md)', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
              >
                <i className={`ph ${copiado ? 'ph-check' : 'ph-copy'}`}></i>
                {copiado ? 'Copiado!' : 'Copiar link'}
              </button>
            </div>
          </section>
        )}

        {/* Já instalado */}
        {instalado && (
          <section className="glass-card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
            <i className="ph ph-check-circle" style={{ fontSize: '3rem', color: '#22c55e', display: 'block', marginBottom: '12px' }}></i>
            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>App instalado!</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              O app já está salvo na sua tela inicial. Bem-vindo à {config.nomeIgreja}!
            </p>
          </section>
        )}

        {/* Botão nativo Android */}
        {!instalado && podInstalar && (
          <section className="glass-card" style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-lg)', textAlign: 'center' }}>
            <i className="ph ph-device-mobile" style={{ fontSize: '2.5rem', color: 'var(--accent-color)', display: 'block', marginBottom: '12px' }}></i>
            <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>Instalar na tela inicial</h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)' }}>
              Acesse o app rapidamente sem precisar abrir o navegador.
            </p>
            <button onClick={handleInstalar} className="primary-btn" style={{ width: '100%', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, padding: '14px' }}>
              <i className="ph ph-download-simple"></i>
              Instalar App
            </button>
          </section>
        )}

        {/* QR Code */}
        <section className="glass-card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', marginBottom: 'var(--spacing-lg)' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '20px' }}>
            Compartilhe com outros membros
          </p>
          <div style={{ display: 'inline-block', padding: '16px', background: '#0d0d0d', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', marginBottom: '20px' }}>
            <img src={QR_URL} alt="QR Code do App" width={220} height={220} style={{ display: 'block', borderRadius: '8px' }} />
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{config.nomeIgreja}</p>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '20px' }}>{APP_URL}</p>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={copiarLink} className="primary-btn" style={{ flex: 1, justifyContent: 'center', background: copiado ? 'rgba(34,197,94,0.15)' : 'var(--bg-surface-elevated)', color: copiado ? '#22c55e' : 'var(--text-primary)', border: `1px solid ${copiado ? 'rgba(34,197,94,0.3)' : 'var(--border-color)'}` }}>
              <i className={`ph ${copiado ? 'ph-check' : 'ph-copy'}`}></i>
              {copiado ? 'Copiado!' : 'Copiar link'}
            </button>
            <a href={APP_URL} target="_blank" rel="noopener noreferrer" className="primary-btn" style={{ flex: 1, justifyContent: 'center', textDecoration: 'none' }}>
              <i className="ph ph-arrow-square-out"></i>
              Abrir app
            </a>
          </div>
        </section>

        {/* Instruções iOS */}
        {(isIOS || (!isAndroid && !podInstalar && !instalado)) && (
          <>
            <h3 className="section-title">Como instalar no iPhone</h3>
            <section className="glass-card" style={{ marginBottom: 'var(--spacing-lg)', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, #818cf8, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ph ph-apple-logo" style={{ fontSize: '1.2rem', color: '#fff' }}></i>
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>iPhone — Safari</p>
              </div>
              {[
                { n: 1, txt: 'Abra este link no Safari (não funciona no Chrome do iPhone)' },
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
          </>
        )}

        {/* Instruções Android (quando não tem prompt disponível) */}
        {isAndroid && !podInstalar && !instalado && (
          <>
            <h3 className="section-title">Como instalar no Android</h3>
            <section className="glass-card" style={{ marginBottom: 'var(--spacing-lg)', padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'linear-gradient(135deg, #4ade80, #22c55e)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="ph ph-android-logo" style={{ fontSize: '1.2rem', color: '#fff' }}></i>
                </div>
                <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Android — Chrome</p>
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
          </>
        )}

        <section className="glass-card word-card" style={{ textAlign: 'center' }}>
          <i className="ph ph-church" style={{ fontSize: '1.8rem', color: 'var(--accent-color)', display: 'block', marginBottom: '8px' }}></i>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Compartilhe com membros e visitantes da <strong>{config.nomeIgreja}</strong>. Quanto mais pessoas conectadas, mais forte nossa comunidade!
          </p>
        </section>

      </main>
    </div>
  );
}
