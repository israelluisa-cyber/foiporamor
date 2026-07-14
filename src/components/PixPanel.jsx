import { useState } from 'react';
import Toast from './Toast';
import { loadConfig } from '../data/config';

const STEPS = [
  { n: '1', text: 'Copie a chave PIX acima' },
  { n: '2', text: 'Abra o app do seu banco' },
  { n: '3', text: 'Selecione PIX → Pagar → Colar chave' },
  { n: '4', text: 'Digite o valor desejado e confirme' },
];

export default function PixPanel({ toastText = 'Chave PIX copiada!', tipo = 'Contribuição', onSuccess, pixKey: pixKeyProp, pixNome: pixNomeProp, pixCnpj: pixCnpjProp }) {
  const config = loadConfig();
  const pixKey = pixKeyProp || config.pixKey || 'igrejafoiporamor@exemplo.com.br';
  // Só cai pro nome/CNPJ geral quando também está usando a chave geral — evita mostrar
  // dados de uma chave diferente da que está sendo exibida.
  const usandoChaveGeral = !pixKeyProp;
  const pixNome = pixNomeProp || (usandoChaveGeral ? config.pixNome : '') || '';
  const pixCnpj = pixCnpjProp || (usandoChaveGeral ? config.pixCnpj : '') || '';

  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(pixKey);
    } catch {
      const el = document.createElement('textarea');
      el.value = pixKey;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopied(true);
    setToastMessage(toastText);
    if (onSuccess) onSuccess({ tipo, data: new Date().toLocaleDateString('pt-BR') });
    setTimeout(() => setCopied(false), 4000);
  };

  return (
    <>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: 'var(--spacing-lg)', lineHeight: 1.7 }}>
        Copie o código e faça sua contribuição para a obra de Deus.
      </p>

      {/* Favorecido — pra pessoa conferir que é a chave certa antes de pagar */}
      {(pixNome || pixCnpj) && (
        <div style={{
          background: 'rgba(34,197,94,0.08)',
          border: '1px solid rgba(34,197,94,0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 14px',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <i className="ph ph-user-circle-check" style={{ fontSize: '1.2rem', color: '#22c55e', flexShrink: 0 }}></i>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 2px' }}>
              Confira o favorecido no seu banco
            </p>
            {pixNome && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: 700, margin: 0, wordBreak: 'break-word' }}>
                {pixNome}
              </p>
            )}
            {pixCnpj && (
              <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '2px 0 0', wordBreak: 'break-word' }}>
                CNPJ: {pixCnpj}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Chave PIX */}
      <div style={{
        background: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        marginBottom: 'var(--spacing-md)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', margin: '0 0 5px' }}>
            Chave PIX
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', fontWeight: 600, margin: 0, wordBreak: 'break-all', lineHeight: 1.4 }}>
            {pixKey}
          </p>
        </div>
        <button
          onClick={handleCopy}
          style={{
            flexShrink: 0,
            padding: '9px 18px',
            borderRadius: 'var(--radius-sm)',
            border: 'none',
            background: copied ? '#22c55e' : '#6d28d9',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'background 0.25s',
          }}
        >
          <i className={`ph ${copied ? 'ph-check' : 'ph-copy'}`}></i>
          {copied ? 'Copiado!' : 'Copiar'}
        </button>
      </div>

      {/* Passos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: 'var(--spacing-lg)' }}>
        {STEPS.map(({ n, text }) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'var(--accent-color)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--bg-color)' }}>{n}</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{text}</span>
          </div>
        ))}
      </div>

      {/* Botão principal */}
      <button
        className="primary-btn"
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          background: copied ? '#22c55e' : '#6d28d9',
          color: '#fff',
          transition: 'background 0.25s, color 0.25s',
        }}
        onClick={handleCopy}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <i className={`ph ${copied ? 'ph-check-circle' : 'ph-copy-simple'}`}></i>
          <span>{copied ? 'Chave copiada com sucesso!' : 'Copiar Chave PIX'}</span>
        </span>
      </button>

      {toastMessage && (
        <Toast message={toastMessage} icon="ph-check-circle" type="success" onClose={() => setToastMessage('')} />
      )}
    </>
  );
}
