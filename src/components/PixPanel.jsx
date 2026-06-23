import { useState } from 'react';
import Toast from './Toast';

function formatCurrency(value) {
  const onlyNumbers = value.replace(/\D/g, '');
  if (!onlyNumbers) return '';
  return (parseFloat(onlyNumbers) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function PixPanel({ quickAmounts = ['50,00', '100,00', '200,00'], toastText = 'Chave PIX copiada!', tipo = 'Contribuição', onSuccess }) {
  const [amount, setAmount] = useState('');
  const [generating, setGenerating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showQR, setShowQR] = useState(false);

  const handleAmountChange = (e) => setAmount(formatCurrency(e.target.value));

  const handleGeneratePix = () => {
    setGenerating(true);
    setTimeout(() => {
      setGenerating(false);
      setToastMessage(toastText);
      setShowQR(true);
      if (onSuccess) onSuccess({ tipo, valor: amount, data: new Date().toLocaleDateString('pt-BR') });
      setTimeout(() => setShowQR(false), 120000);
    }, 1500);
  };

  const formatted = (val) => formatCurrency(val.replace(',', ''));

  return (
    <>
      <h3 className="font-heading" style={{ marginBottom: 'var(--spacing-sm)' }}>Valor (R$)</h3>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${quickAmounts.length}, 1fr)`, gap: '10px', marginBottom: 'var(--spacing-md)' }}>
        {quickAmounts.map(val => (
          <button
            key={val}
            style={{
              background: amount === formatted(val) ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
              color: amount === formatted(val) ? 'var(--bg-color)' : 'var(--text-primary)',
              border: '1px solid var(--border-color)', padding: 'var(--spacing-sm) 0',
              borderRadius: 'var(--radius-sm)', fontWeight: 500,
            }}
            onClick={() => setAmount(formatted(val))}
          >
            R$ {val.split(',')[0]}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 'var(--spacing-md)' }}>
        <input
          type="text"
          inputMode="numeric"
          placeholder="R$ 0,00"
          value={amount}
          onChange={handleAmountChange}
          style={{
            width: '100%', background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)',
            color: 'var(--text-primary)', padding: '14px', borderRadius: 'var(--radius-md)',
            fontFamily: 'var(--font-body)', fontSize: '1.3rem', fontWeight: '600',
            letterSpacing: '0.5px', outline: 'none', transition: 'border-color 0.2s',
          }}
          onFocus={e => e.target.style.borderColor = 'var(--accent-color)'}
          onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
        />
      </div>

      {showQR && (
        <div style={{ textAlign: 'center', marginBottom: 'var(--spacing-md)', animation: 'fadeIn 0.4s ease' }}>
          <img src="/qr_concept.png" alt="QR Code PIX" style={{ width: '160px', height: '160px', borderRadius: 'var(--radius-md)', objectFit: 'cover', border: '2px solid var(--border-color)', boxShadow: 'var(--shadow-glass)' }} />
          <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Escaneie ou use a chave copiada.</p>
          <button onClick={() => setShowQR(false)} style={{ marginTop: '6px', fontSize: '0.8rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Fechar</button>
        </div>
      )}

      <button
        className="primary-btn"
        style={{
          marginTop: 'var(--spacing-sm)', width: '100%', display: 'flex', justifyContent: 'center',
          background: toastMessage ? 'var(--bg-surface-elevated)' : 'var(--accent-color)',
          color: toastMessage ? 'var(--text-primary)' : 'var(--bg-color)',
        }}
        onClick={handleGeneratePix}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {generating && <><i className="ph ph-spinner-gap" style={{ animation: 'spin 1s linear infinite' }}></i><span>Gerando...</span></>}
          {!generating && toastMessage && <><i className="ph ph-copy"></i><span>Copiar Novamente</span></>}
          {!generating && !toastMessage && <span>Gerar PIX</span>}
        </span>
      </button>

      {toastMessage && <Toast message={toastMessage} icon="ph-check-circle" type="success" onClose={() => setToastMessage('')} />}
    </>
  );
}
