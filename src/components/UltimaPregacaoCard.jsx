import { useState, useEffect } from 'react';
import { getUltimaPregacao, extractCanalYoutube, urlTodosVideos } from '../data/youtube';

function formatarData(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
}

// Card "Última Pregação" — só aparece se o Admin tiver configurado a chave da
// YouTube Data API (ver Admin.jsx). Busca o vídeo mais recente do canal, com
// cache de algumas horas (ver src/data/youtube.js).
export default function UltimaPregacaoCard({ config }) {
  const [pregacao, setPregacao] = useState(null);

  useEffect(() => {
    if (!config.youtubeApiKey) return;
    let ativo = true;
    getUltimaPregacao(config).then(dados => { if (ativo) setPregacao(dados); });
    return () => { ativo = false; };
  }, [config.youtubeApiKey, config.youtubeLink]);

  if (!config.youtubeApiKey || !pregacao) return null;

  const linkTodos = urlTodosVideos(extractCanalYoutube(config.youtubeLink));

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
        <h3 className="section-title" style={{ margin: 0 }}>Última Pregação</h3>
        {linkTodos && (
          <a href={linkTodos} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--accent-color)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
            Ver todas <i className="ph ph-caret-right"></i>
          </a>
        )}
      </div>

      <a
        href={`https://www.youtube.com/watch?v=${pregacao.videoId}`}
        target="_blank"
        rel="noopener noreferrer"
        className="glass-card pregacao-thumb-card"
        style={{
          position: 'relative', display: 'flex', overflow: 'hidden', padding: 0,
          marginBottom: 'var(--spacing-md)', textDecoration: 'none', minHeight: '170px',
          background: pregacao.thumbnail ? `url(${pregacao.thumbnail})` : 'var(--bg-surface-elevated)',
          backgroundSize: 'cover', backgroundPosition: 'center',
        }}
      >
        {/* Metade visível da foto, com o botão de play */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(0,0,0,0.55)', border: '1px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="ph-fill ph-play" style={{ fontSize: '1.1rem', color: '#fff', marginLeft: '2px' }}></i>
          </div>
        </div>

        {/* Metade escurecida com degradê, onde fica o texto por cima da foto */}
        <div
          style={{
            flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center',
            padding: 'var(--spacing-md)',
            background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.55) 12%, rgba(0,0,0,0.85) 45%, rgba(0,0,0,0.9) 100%)',
          }}
        >
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--accent-color)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}>
            Última Pregação
          </span>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', margin: '0 0 10px', lineHeight: 1.25, textShadow: '0 1px 4px rgba(0,0,0,0.5)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {pregacao.titulo}
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginBottom: '14px' }}>
            {pregacao.duracao && (
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <i className="ph ph-clock"></i> {pregacao.duracao}
              </span>
            )}
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <i className="ph ph-calendar-blank"></i> {formatarData(pregacao.publicadoEm)}
            </span>
          </div>
          <span style={{ display: 'inline-flex', alignSelf: 'flex-start', alignItems: 'center', gap: '6px', background: 'var(--accent-color)', color: 'var(--bg-color)', padding: '8px 16px', borderRadius: 'var(--radius-full)', fontSize: '0.8rem', fontWeight: 700 }}>
            <i className="ph-fill ph-play"></i> Assistir Culto
          </span>
        </div>
      </a>
    </>
  );
}
