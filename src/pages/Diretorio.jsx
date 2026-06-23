import { useState } from 'react';
import Header from '../components/Header';
import { loadMembros } from '../data/membros';

function getInitials(nome) {
  return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
}

const GRUPOS = ['Todos', 'Geração de Fogo', 'Lar de Paz'];

export default function Diretorio() {
  const [busca, setBusca] = useState('');
  const [grupo, setGrupo] = useState('Todos');
  const MEMBROS = loadMembros();

  const filtrados = MEMBROS.filter(m => {
    const matchGrupo = grupo === 'Todos' || m.celula === grupo;
    const matchBusca = m.nome.toLowerCase().includes(busca.toLowerCase()) ||
                       m.bairro.toLowerCase().includes(busca.toLowerCase());
    return matchGrupo && matchBusca;
  });

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Diretório" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        <div style={{ position: 'relative', marginBottom: 'var(--spacing-md)' }}>
          <i className="ph ph-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' }}></i>
          <input
            type="text"
            placeholder="Buscar por nome ou bairro..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{
              width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-full)', padding: '12px 14px 12px 42px',
              color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.9rem', outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: 'var(--spacing-lg)' }}>
          {GRUPOS.map(g => (
            <button key={g} onClick={() => setGrupo(g)} style={{
              whiteSpace: 'nowrap', padding: '7px 16px', borderRadius: 'var(--radius-full)',
              background: grupo === g ? 'var(--accent-color)' : 'var(--bg-surface)',
              color: grupo === g ? 'var(--bg-color)' : 'var(--text-secondary)',
              border: `1px solid ${grupo === g ? 'var(--accent-color)' : 'var(--border-color)'}`,
              fontSize: '0.82rem', fontWeight: grupo === g ? 700 : 400, transition: 'all 0.2s',
            }}>
              {g}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
          {filtrados.length} membro{filtrados.length !== 1 ? 's' : ''}
        </p>

        <section className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtrados.map((membro, i) => (
            <div key={membro.id} style={{
              display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)',
              padding: 'var(--spacing-md)',
              borderBottom: i < filtrados.length - 1 ? '1px solid var(--border-color)' : 'none',
            }}>
              {membro.foto ? (
                <img src={membro.foto} alt={membro.nome} style={{
                  width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover',
                  flexShrink: 0, border: '1px solid var(--border-color)',
                }} />
              ) : (
                <div style={{
                  width: '44px', height: '44px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--bg-surface-elevated)', border: '1px solid var(--border-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--font-heading)', fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {getInitials(membro.nome)}
                  </span>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{membro.nome}</p>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  {membro.cargo} · {membro.celula}
                </p>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="ph ph-map-pin"></i> {membro.bairro}
                </p>
              </div>
            </div>
          ))}
        </section>

      </main>
    </div>
  );
}
