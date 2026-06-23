import { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';

const INDICE = [
  /* Páginas */
  { tipo: 'Página',    icon: 'ph-house',             label: 'Início',              rota: '/',               tags: 'home culto countdown' },
  { tipo: 'Página',    icon: 'ph-hands-praying',      label: 'Pedidos de Oração',   rota: '/oracao',         tags: 'oração intercessão pedido mural' },
  { tipo: 'Página',    icon: 'ph-hand-heart',         label: 'Contribuir',          rota: '/financeiro',     tags: 'dízimo oferta pix contribuição financeiro missões' },
  { tipo: 'Página',    icon: 'ph-calendar-check',     label: 'Programação',         rota: '/programacao',    tags: 'agenda culto horário semana programação' },
  { tipo: 'Página',    icon: 'ph-graduation-cap',     label: 'Teologia — ITEAP',    rota: '/teologia',       tags: 'teologia curso instituto aula estudo' },
  { tipo: 'Página',    icon: 'ph-play-circle',        label: 'Culto Ao Vivo',       rota: '/culto',          tags: 'culto ao vivo transmissão louvor mensagem' },
  { tipo: 'Página',    icon: 'ph-book-open-text',     label: 'Sermões',             rota: '/sermoes',        tags: 'sermão pregação palavra pastor biblioteca' },
  { tipo: 'Página',    icon: 'ph-book-bookmark',      label: 'Devocional',          rota: '/devocional',     tags: 'devocional palavra dia reflexão oração' },
  { tipo: 'Página',    icon: 'ph-bible',              label: 'Plano de Leitura',    rota: '/biblia',         tags: 'bíblia leitura plano gênesis êxodo joão salmos' },
  { tipo: 'Página',    icon: 'ph-megaphone',          label: 'Avisos da Igreja',    rota: '/avisos',         tags: 'aviso comunicado notícia informativo evento urgente' },
  { tipo: 'Página',    icon: 'ph-star',               label: 'Testemunhos',         rota: '/testemunhos',    tags: 'testemunho glória milagre compartilhar' },
  { tipo: 'Página',    icon: 'ph-users-three',        label: 'Grupos & Células',    rota: '/grupos',         tags: 'grupo célula comunhão geração fogo lar paz' },
  { tipo: 'Página',    icon: 'ph-address-book',       label: 'Diretório de Membros', rota: '/diretorio',    tags: 'diretório membro contato célula lista' },
  { tipo: 'Página',    icon: 'ph-images',             label: 'Galeria',             rota: '/galeria',        tags: 'galeria foto imagem evento retiro' },
  { tipo: 'Página',    icon: 'ph-hand-waving',        label: 'Voluntários',         rota: '/voluntarios',    tags: 'voluntário escala ministério servir recepção mídia' },
  { tipo: 'Página',    icon: 'ph-heart',              label: 'Aconselhamento',      rota: '/aconselhamento', tags: 'aconselhamento pastoral cuidado pastor ajuda' },
  { tipo: 'Página',    icon: 'ph-baby',               label: 'Check-in Infantil',   rota: '/checkin',        tags: 'check-in infantil crianças maternal jardim' },
  { tipo: 'Página',    icon: 'ph-user-circle',        label: 'Minha Conta',         rota: '/usuario',        tags: 'conta login cadastro membro entrar' },
  { tipo: 'Página',    icon: 'ph-identification-card', label: 'Carteira de Membro', rota: '/carteira',       tags: 'carteira membro identidade qr code' },
  { tipo: 'Página',    icon: 'ph-user-gear',          label: 'Meu Perfil',          rota: '/perfil',         tags: 'perfil dados pessoais editar' },
  /* Cultos */
  { tipo: 'Culto',     icon: 'ph-graduation-cap',     label: 'Curso de Teologia', rota: '/programacao', tags: 'teologia curso terça 19h30 ensino bíblia' },
  { tipo: 'Culto',     icon: 'ph-hands-praying',      label: 'Culto de Oração',     rota: '/programacao',    tags: 'oração quinta 19h30 adoração' },
  { tipo: 'Culto',     icon: 'ph-church',             label: 'Culto de Celebração', rota: '/programacao',    tags: 'domingo 10h celebração' },
  { tipo: 'Culto',     icon: 'ph-music-notes',        label: 'Ensaio do Louvor',    rota: '/programacao',    tags: 'ensaio louvor sexta 19h30 ministério' },
];

export default function Busca() {
  const [query, setQuery] = useState('');

  const resultados = query.trim().length < 2
    ? []
    : INDICE.filter(item => {
        const q = query.toLowerCase();
        return (
          item.label.toLowerCase().includes(q) ||
          item.tags.toLowerCase().includes(q) ||
          item.tipo.toLowerCase().includes(q)
        );
      });

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Buscar" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        {/* Campo de busca */}
        <div style={{ position: 'relative', marginBottom: 'var(--spacing-lg)' }}>
          <i className="ph ph-magnifying-glass" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '1.1rem', color: 'var(--text-muted)' }}></i>
          <input
            autoFocus
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar páginas, cultos, recursos..."
            style={{ width: '100%', padding: '13px 14px 13px 42px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', color: 'var(--text-primary)', fontFamily: 'var(--font-body)', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }}
            onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
            onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', display: 'flex' }}>
              <i className="ph ph-x"></i>
            </button>
          )}
        </div>

        {/* Estado inicial */}
        {query.trim().length < 2 && (
          <div style={{ textAlign: 'center', paddingTop: '40px' }}>
            <i className="ph ph-magnifying-glass" style={{ fontSize: '2.5rem', color: 'var(--text-muted)', display: 'block', marginBottom: '12px' }}></i>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Digite pelo menos 2 caracteres para buscar</p>
            <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' }}>
              {['Oração', 'Culto', 'Sermão', 'Financeiro', 'Células', 'Devocional'].map(s => (
                <button key={s} onClick={() => setQuery(s)} style={{ padding: '6px 14px', background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.85rem' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Resultados */}
        {query.trim().length >= 2 && (
          <>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 'var(--spacing-md)', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
              {resultados.length} resultado{resultados.length !== 1 ? 's' : ''} para "{query}"
            </p>

            {resultados.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: '24px' }}>
                <i className="ph ph-smiley-sad" style={{ fontSize: '2rem', color: 'var(--text-muted)', display: 'block', marginBottom: '10px' }}></i>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Nenhum resultado encontrado</p>
              </div>
            ) : (
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                {resultados.map((item, i) => (
                  <Link
                    key={i}
                    to={item.rota}
                    style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', padding: 'var(--spacing-md)', borderBottom: i < resultados.length - 1 ? '1px solid var(--border-color)' : 'none', textDecoration: 'none' }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <i className={`ph ${item.icon}`} style={{ fontSize: '1.2rem', color: 'var(--accent-color)' }}></i>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: '0.92rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px' }}>{item.label}</p>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{item.tipo}</p>
                    </div>
                    <i className="ph ph-caret-right" style={{ color: 'var(--text-muted)' }}></i>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
