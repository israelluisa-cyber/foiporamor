import { useState } from 'react';
import Header from '../components/Header';

const FOTOS_DEFAULT = [
  { id: 1, categoria: 'Cultos',   titulo: 'Culto de Celebração',       data: 'Jun 2025', img: '/hero_bg.png' },
  { id: 2, categoria: 'Eventos',  titulo: 'Congresso de Jovens',        data: 'Mai 2025', img: '/offering_bg.png' },
  { id: 3, categoria: 'Retiros',  titulo: 'Retiro Geração de Fogo',     data: 'Abr 2025', img: '/theology_course.png' },
  { id: 4, categoria: 'Cultos',   titulo: 'Curso de Teologia',          data: 'Jun 2025', img: '/theology_course.png' },
  { id: 5, categoria: 'Missões',  titulo: 'Ação Social Centro de SP',   data: 'Mar 2025', img: '/hero_bg.png' },
  { id: 6, categoria: 'Eventos',  titulo: 'Jantar de Confraternização', data: 'Fev 2025', img: '/offering_bg.png' },
];

function loadFotos() {
  try {
    const salvas = JSON.parse(localStorage.getItem('galeria_fotos'));
    return salvas && salvas.length ? salvas : FOTOS_DEFAULT;
  } catch { return FOTOS_DEFAULT; }
}

function loadTemas() {
  try {
    const salvos = JSON.parse(localStorage.getItem('galeria_temas'));
    return salvos && salvos.length ? salvos : ['Cultos', 'Eventos', 'Retiros', 'Missões'];
  } catch { return ['Cultos', 'Eventos', 'Retiros', 'Missões']; }
}

export default function Galeria() {
  const [fotos]     = useState(loadFotos);
  const [temas]     = useState(loadTemas);
  const [categoria, setCategoria] = useState('Todos');
  const [ampliada,  setAmpliada]  = useState(null);

  const categorias  = ['Todos', ...temas];
  const filtradas   = categoria === 'Todos' ? fotos : fotos.filter(f => f.categoria === categoria);

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Galeria" backButton={true} />

      {/* Modal foto ampliada */}
      {ampliada && (
        <div
          onClick={() => setAmpliada(null)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 500,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: 'var(--spacing-lg)', animation: 'fadeIn 0.2s ease',
          }}
        >
          <img
            src={ampliada.img}
            alt={ampliada.titulo}
            style={{ width: '100%', maxWidth: '500px', borderRadius: 'var(--radius-md)', objectFit: 'cover', maxHeight: '65vh' }}
          />
          <p style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '16px', fontSize: '1rem' }}>{ampliada.titulo}</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>
            {ampliada.categoria}{ampliada.data ? ` · ${ampliada.data}` : ''}
          </p>
          <button
            onClick={() => setAmpliada(null)}
            style={{ marginTop: '20px', color: 'var(--text-secondary)', background: 'none', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', padding: '8px 20px', fontSize: '0.85rem' }}
          >
            Fechar
          </button>
        </div>
      )}

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Filtro de categorias */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px', marginBottom: 'var(--spacing-lg)', scrollbarWidth: 'none' }}>
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setCategoria(c)}
              style={{
                whiteSpace: 'nowrap', padding: '7px 16px', borderRadius: 'var(--radius-full)',
                background: categoria === c ? 'var(--accent-color)' : 'var(--bg-surface)',
                color: categoria === c ? 'var(--bg-color)' : 'var(--text-secondary)',
                border: `1px solid ${categoria === c ? 'var(--accent-color)' : 'var(--border-color)'}`,
                fontSize: '0.82rem', fontWeight: categoria === c ? 700 : 400, transition: 'all 0.2s',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {filtradas.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '48px 0', fontSize: '0.9rem' }}>
            Nenhuma foto nesta categoria ainda.
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {filtradas.map(foto => (
              <div
                key={foto.id}
                onClick={() => setAmpliada(foto)}
                style={{ position: 'relative', borderRadius: 'var(--radius-md)', overflow: 'hidden', cursor: 'pointer', aspectRatio: '1', background: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
              >
                <img
                  src={foto.img}
                  alt={foto.titulo}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75, transition: 'opacity 0.2s' }}
                  onMouseEnter={e => e.target.style.opacity = 1}
                  onMouseLeave={e => e.target.style.opacity = 0.75}
                />
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(0,0,0,0.82))', padding: '20px 10px 10px' }}>
                  <p style={{ fontSize: '0.75rem', color: '#fff', fontWeight: 600, lineHeight: 1.3 }}>{foto.titulo}</p>
                  {foto.data && <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.6)' }}>{foto.data}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
