import { useState } from 'react';
import Header from '../components/Header';

const SERIES = ['Todas', 'Fundamentos da Fé', 'Frutos do Espírito', 'Identidade em Cristo', 'Família'];

const SERMOES = [
  { id: 1, titulo: 'A Essência da Graça', pastor: 'Pr. Luís Carlos', serie: 'Fundamentos da Fé', escritura: 'Efésios 2:8-9', data: '15/06/2025', duracao: '52 min', youtube: 'jfKfPfyJRdk' },
  { id: 2, titulo: 'Vida na Presença de Deus', pastor: 'Pr. Luís Carlos', serie: 'Fundamentos da Fé', escritura: 'Salmo 16:11', data: '08/06/2025', duracao: '48 min', youtube: 'jfKfPfyJRdk' },
  { id: 3, titulo: 'O Amor que Transforma', pastor: 'Pr. Luís Carlos', serie: 'Frutos do Espírito', escritura: 'Gálatas 5:22-23', data: '01/06/2025', duracao: '45 min', youtube: 'jfKfPfyJRdk' },
  { id: 4, titulo: 'Identidade no Filho', pastor: 'Pr. Luís Carlos', serie: 'Identidade em Cristo', escritura: 'João 1:12', data: '25/05/2025', duracao: '56 min', youtube: 'jfKfPfyJRdk' },
  { id: 5, titulo: 'A Família segundo Deus', pastor: 'Pr. Luís Carlos', serie: 'Família', escritura: 'Efésios 5:22-33', data: '18/05/2025', duracao: '61 min', youtube: 'jfKfPfyJRdk' },
  { id: 6, titulo: 'Alegria Inabalável', pastor: 'Pr. Luís Carlos', serie: 'Frutos do Espírito', escritura: 'Filipenses 4:4', data: '11/05/2025', duracao: '44 min', youtube: 'jfKfPfyJRdk' },
  { id: 7, titulo: 'A Fé que Move Montanhas', pastor: 'Pr. Luís Carlos', serie: 'Fundamentos da Fé', escritura: 'Hebreus 11:1', data: '04/05/2025', duracao: '50 min', youtube: 'jfKfPfyJRdk' },
  { id: 8, titulo: 'Paz que Excede o Entendimento', pastor: 'Pr. Luís Carlos', serie: 'Frutos do Espírito', escritura: 'Filipenses 4:7', data: '27/04/2025', duracao: '47 min', youtube: 'jfKfPfyJRdk' },
  { id: 9, titulo: 'Filhos da Promessa', pastor: 'Pr. Luís Carlos', serie: 'Identidade em Cristo', escritura: 'Gálatas 3:29', data: '20/04/2025', duracao: '53 min', youtube: 'jfKfPfyJRdk' },
  { id: 10, titulo: 'O Lar como Ministério', pastor: 'Pr. Luís Carlos', serie: 'Família', escritura: 'Josué 24:15', data: '13/04/2025', duracao: '58 min', youtube: 'jfKfPfyJRdk' },
];

export default function Sermoes() {
  const [serieFiltro, setSerieFiltro] = useState('Todas');
  const [busca, setBusca] = useState('');
  const [playing, setPlaying] = useState(null);

  const filtrados = SERMOES.filter(s => {
    const matchSerie = serieFiltro === 'Todas' || s.serie === serieFiltro;
    const matchBusca = s.titulo.toLowerCase().includes(busca.toLowerCase()) ||
                       s.escritura.toLowerCase().includes(busca.toLowerCase());
    return matchSerie && matchBusca;
  });

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Sermões" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Busca */}
        <div style={{ position: 'relative', marginBottom: 'var(--spacing-md)' }}>
          <i className="ph ph-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: '1.1rem' }}></i>
          <input
            type="text"
            placeholder="Buscar por título ou referência..."
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

        {/* Filtro de séries */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: 'var(--spacing-lg)', scrollbarWidth: 'none' }}>
          {SERIES.map(s => (
            <button key={s} onClick={() => setSerieFiltro(s)} style={{
              whiteSpace: 'nowrap', padding: '7px 16px', borderRadius: 'var(--radius-full)',
              background: serieFiltro === s ? 'var(--accent-color)' : 'var(--bg-surface)',
              color: serieFiltro === s ? 'var(--bg-color)' : 'var(--text-secondary)',
              border: `1px solid ${serieFiltro === s ? 'var(--accent-color)' : 'var(--border-color)'}`,
              fontSize: '0.82rem', fontWeight: serieFiltro === s ? 700 : 400,
              transition: 'all 0.2s',
            }}>
              {s}
            </button>
          ))}
        </div>

        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)' }}>
          {filtrados.length} sermão{filtrados.length !== 1 ? 'ões' : ''} encontrado{filtrados.length !== 1 ? 's' : ''}
        </p>

        {/* Lista de sermões */}
        {filtrados.map(sermao => (
          <div key={sermao.id}>
            {playing === sermao.id && (
              <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '8px' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${sermao.youtube}?autoplay=1`}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            <div className="glass-card" style={{ padding: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
              <button
                onClick={() => setPlaying(playing === sermao.id ? null : sermao.id)}
                style={{
                  width: '52px', height: '52px', borderRadius: 'var(--radius-md)', flexShrink: 0,
                  background: playing === sermao.id ? 'var(--accent-color)' : 'var(--bg-surface-elevated)',
                  border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: playing === sermao.id ? 'var(--bg-color)' : 'var(--text-primary)', fontSize: '1.4rem',
                  transition: 'all 0.2s',
                }}
              >
                <i className={`ph ${playing === sermao.id ? 'ph-pause' : 'ph-play'}`}></i>
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>{sermao.serie}</span>
                <h4 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', margin: '2px 0', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{sermao.titulo}</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>
                  <i className="ph ph-book-bookmark"></i> {sermao.escritura}
                </p>
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <i className="ph ph-calendar-blank"></i> {sermao.data}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <i className="ph ph-clock"></i> {sermao.duracao}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

      </main>
    </div>
  );
}
