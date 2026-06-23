import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';

const KEY = 'biblia_progresso';

const PLANO = [
  { dia: 1,  vt: 'Gênesis 1-2',        nt: 'João 1:1-18',        sl: 'Salmo 1' },
  { dia: 2,  vt: 'Gênesis 3-5',        nt: 'João 1:19-51',       sl: 'Salmo 2' },
  { dia: 3,  vt: 'Gênesis 6-8',        nt: 'João 2',             sl: 'Salmo 8' },
  { dia: 4,  vt: 'Gênesis 9-11',       nt: 'João 3:1-21',        sl: 'Salmo 19' },
  { dia: 5,  vt: 'Gênesis 12-14',      nt: 'João 3:22-36',       sl: 'Salmo 23' },
  { dia: 6,  vt: 'Gênesis 15-17',      nt: 'João 4:1-30',        sl: 'Salmo 27' },
  { dia: 7,  vt: 'Gênesis 18-20',      nt: 'João 4:31-54',       sl: 'Salmo 34' },
  { dia: 8,  vt: 'Gênesis 21-23',      nt: 'João 5:1-24',        sl: 'Salmo 37' },
  { dia: 9,  vt: 'Gênesis 24-25',      nt: 'João 5:25-47',       sl: 'Salmo 46' },
  { dia: 10, vt: 'Gênesis 26-28',      nt: 'João 6:1-21',        sl: 'Salmo 51' },
  { dia: 11, vt: 'Gênesis 29-31',      nt: 'João 6:22-59',       sl: 'Salmo 63' },
  { dia: 12, vt: 'Gênesis 32-34',      nt: 'João 6:60-71',       sl: 'Salmo 84' },
  { dia: 13, vt: 'Gênesis 35-37',      nt: 'João 7:1-31',        sl: 'Salmo 90' },
  { dia: 14, vt: 'Gênesis 38-40',      nt: 'João 7:32-53',       sl: 'Salmo 91' },
  { dia: 15, vt: 'Gênesis 41-42',      nt: 'João 8:1-30',        sl: 'Salmo 100' },
  { dia: 16, vt: 'Gênesis 43-45',      nt: 'João 8:31-59',       sl: 'Salmo 103' },
  { dia: 17, vt: 'Gênesis 46-47',      nt: 'João 9',             sl: 'Salmo 104' },
  { dia: 18, vt: 'Gênesis 48-50',      nt: 'João 10:1-21',       sl: 'Salmo 107' },
  { dia: 19, vt: 'Êxodo 1-3',          nt: 'João 10:22-42',      sl: 'Salmo 110' },
  { dia: 20, vt: 'Êxodo 4-6',          nt: 'João 11:1-37',       sl: 'Salmo 116' },
  { dia: 21, vt: 'Êxodo 7-9',          nt: 'João 11:38-57',      sl: 'Salmo 119:1-40' },
  { dia: 22, vt: 'Êxodo 10-12',        nt: 'João 12:1-26',       sl: 'Salmo 119:41-80' },
  { dia: 23, vt: 'Êxodo 13-15',        nt: 'João 12:27-50',      sl: 'Salmo 121' },
  { dia: 24, vt: 'Êxodo 16-18',        nt: 'João 13:1-20',       sl: 'Salmo 127' },
  { dia: 25, vt: 'Êxodo 19-21',        nt: 'João 13:21-38',      sl: 'Salmo 128' },
  { dia: 26, vt: 'Êxodo 22-24',        nt: 'João 14',            sl: 'Salmo 130' },
  { dia: 27, vt: 'Êxodo 25-27',        nt: 'João 15',            sl: 'Salmo 131' },
  { dia: 28, vt: 'Êxodo 28-30',        nt: 'João 16',            sl: 'Salmo 133' },
  { dia: 29, vt: 'Êxodo 31-33',        nt: 'João 17',            sl: 'Salmo 136' },
  { dia: 30, vt: 'Êxodo 34-36',        nt: 'João 18:1-27',       sl: 'Salmo 139' },
];

function loadProgresso() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

export default function Biblia() {
  const [concluidos, setConcluidos] = useState(loadProgresso);
  const [toast, setToast] = useState('');

  const toggleDia = (dia) => {
    const novos = concluidos.includes(dia)
      ? concluidos.filter(d => d !== dia)
      : [...concluidos, dia];
    setConcluidos(novos);
    localStorage.setItem(KEY, JSON.stringify(novos));
    if (!concluidos.includes(dia)) setToast(`Dia ${dia} concluído! Parabéns!`);
  };

  const pct = Math.round((concluidos.length / PLANO.length) * 100);

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Plano de Leitura" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Progresso */}
        <section className="glass-card" style={{ marginBottom: 'var(--spacing-md)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600, marginBottom: '4px' }}>Progresso Geral</p>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', color: 'var(--text-primary)', lineHeight: 1 }}>{pct}<span style={{ fontSize: '1rem' }}>%</span></h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{concluidos.length}/{PLANO.length} dias</p>
          </div>
          <div style={{ width: '100%', height: '6px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--accent-color)', borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease' }} />
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '10px' }}>Plano de 30 dias — Gênesis, Êxodo e Evangelho de João</p>
        </section>

        {/* Lista de dias */}
        {PLANO.map(item => {
          const feito = concluidos.includes(item.dia);
          return (
            <div
              key={item.dia}
              onClick={() => toggleDia(item.dia)}
              style={{
                background: feito ? 'var(--bg-surface)' : 'var(--bg-surface)',
                border: `1px solid ${feito ? 'rgba(255,255,255,0.2)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)', padding: 'var(--spacing-md)',
                marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '14px',
                cursor: 'pointer', transition: 'all 0.2s', opacity: feito ? 0.7 : 1,
              }}
            >
              <div style={{
                width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                background: feito ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
                border: `1px solid ${feito ? 'var(--accent-color)' : 'var(--border-color)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {feito
                  ? <i className="ph ph-check" style={{ color: 'var(--bg-color)', fontSize: '1rem', fontWeight: 700 }}></i>
                  : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{item.dia}</span>
                }
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px', textDecoration: feito ? 'line-through' : 'none' }}>Dia {item.dia}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  {item.vt} · {item.nt} · {item.sl}
                </p>
              </div>
            </div>
          );
        })}

      </main>

      {toast && <Toast message={toast} icon="ph-check-circle" type="success" onClose={() => setToast('')} />}
    </div>
  );
}
