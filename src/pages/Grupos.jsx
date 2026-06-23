import { useState } from 'react';
import Header from '../components/Header';
import Toast from '../components/Toast';
import { loadConfig } from '../data/config';

const GRUPOS_PRINCIPAIS = [
  {
    id: 'membros',
    nome: 'Membros',
    descricao: 'Grupo geral da congregação da Igreja Foi Por Amor. Avisos, informações e comunhão.',
    icone: 'ph-users-three',
    cor: 'rgba(255,255,255,0.08)',
    corBorda: 'rgba(255,255,255,0.15)',
    corTexto: 'var(--text-primary)',
    configKey: 'membros',
  },
  {
    id: 'obreiros',
    nome: 'Ministério de Obreiros - FPA',
    descricao: 'Equipe de diáconos e diaconisas que servem na casa de Deus com dedicação.',
    icone: 'ph-shield-star',
    cor: 'rgba(251,146,60,0.12)',
    corBorda: 'rgba(251,146,60,0.35)',
    corTexto: '#fb923c',
    configKey: 'obreiros',
  },
  {
    id: 'iteap',
    nome: 'ITEAP - Instituto Teológico Amor e Palavra',
    descricao: 'Grupo dos alunos e professores do instituto teológico da Igreja Foi Por Amor.',
    icone: 'ph-book-open-text',
    cor: 'rgba(99,102,241,0.12)',
    corBorda: 'rgba(99,102,241,0.35)',
    corTexto: '#818cf8',
    configKey: 'iteap',
  },
  {
    id: 'jovens',
    nome: 'Coordenação Jovens - FPA',
    descricao: 'Espaço de organização e comunhão da coordenação do ministério de jovens.',
    icone: 'ph-lightning',
    cor: 'rgba(251,191,36,0.12)',
    corBorda: 'rgba(251,191,36,0.35)',
    corTexto: '#fbbf24',
    configKey: 'jovens',
  },
];

const GRUPOS_ABERTOS = [
  {
    id: 'anas',
    nome: 'Anas (Ministério de Mulheres) FPA',
    descricao: 'Ministério dedicado às mulheres da igreja, promovendo comunhão, fé e identidade.',
    icone: 'ph-flower-lotus',
    cor: 'rgba(236,72,153,0.12)',
    corBorda: 'rgba(236,72,153,0.35)',
    corTexto: '#f472b6',
    configKey: 'anas',
  },
  {
    id: 'louvor',
    nome: 'Louvor e Adoração - FPA',
    descricao: 'Grupo do ministério de louvor e adoração da Igreja Foi Por Amor.',
    icone: 'ph-music-notes',
    cor: 'rgba(52,211,153,0.12)',
    corBorda: 'rgba(52,211,153,0.35)',
    corTexto: '#34d399',
    configKey: 'louvor',
  },
  {
    id: 'kids',
    nome: 'Ministério Kids - FPA',
    descricao: 'Equipe dedicada ao cuidado e ensino das crianças da Igreja Foi Por Amor.',
    icone: 'ph-baby',
    cor: 'rgba(251,191,36,0.12)',
    corBorda: 'rgba(251,191,36,0.35)',
    corTexto: '#fbbf24',
    configKey: 'kids',
  },
  {
    id: 'evangelismo',
    nome: 'Evangelismo FPA',
    descricao: 'Equipe responsável pelas ações evangelísticas e alcance da nossa comunidade.',
    icone: 'ph-megaphone',
    cor: 'rgba(251,146,60,0.12)',
    corBorda: 'rgba(251,146,60,0.35)',
    corTexto: '#fb923c',
    configKey: 'evangelismo',
  },
  {
    id: 'musicos',
    nome: 'Músicos e Adoração - FPA',
    descricao: 'Grupo dos músicos instrumentistas que ministram nos cultos da igreja.',
    icone: 'ph-guitar',
    cor: 'rgba(99,102,241,0.12)',
    corBorda: 'rgba(99,102,241,0.35)',
    corTexto: '#818cf8',
    configKey: 'musicos',
  },
  {
    id: 'bemvindo',
    nome: 'Ministério "Bem-vindo" - FPA',
    descricao: 'Equipe de recepção e acolhimento de visitantes e novos membros.',
    icone: 'ph-hand-waving',
    cor: 'rgba(52,211,153,0.12)',
    corBorda: 'rgba(52,211,153,0.35)',
    corTexto: '#34d399',
    configKey: 'bemvindo',
  },
  {
    id: 'conselho',
    nome: 'Conselho Igreja - FPA',
    descricao: 'Conselho de líderes e presbíteros responsáveis pela governança da igreja.',
    icone: 'ph-crown',
    cor: 'rgba(251,191,36,0.12)',
    corBorda: 'rgba(251,191,36,0.35)',
    corTexto: '#fbbf24',
    configKey: 'conselho',
  },
  {
    id: 'professores',
    nome: 'Professores Kids - FPA',
    descricao: 'Equipe de professores voluntários que ensinam as crianças na Palavra de Deus.',
    icone: 'ph-chalkboard-teacher',
    cor: 'rgba(236,72,153,0.12)',
    corBorda: 'rgba(236,72,153,0.35)',
    corTexto: '#f472b6',
    configKey: 'professores',
  },
  {
    id: 'midia',
    nome: 'Mídia Foi Por Amor',
    descricao: 'Equipe de comunicação, transmissão ao vivo, redes sociais e design da FPA.',
    icone: 'ph-broadcast',
    cor: 'rgba(99,102,241,0.12)',
    corBorda: 'rgba(99,102,241,0.35)',
    corTexto: '#818cf8',
    configKey: 'midia',
  },
];

export default function Grupos() {
  const [toast, setToast] = useState('');
  const config = loadConfig();
  const wa = config.whatsapp || {};

  const handleWhatsApp = (grupo) => {
    const numero = wa[grupo.configKey] || '';
    if (!numero) {
      setToast('Número não configurado. Acesse Admin > Configurações > WhatsApp.');
      return;
    }
    const msg = encodeURIComponent(`Olá! Gostaria de entrar no grupo "${grupo.nome}". Podem me adicionar?`);
    window.open(`https://wa.me/${numero}?text=${msg}`, '_blank');
  };

  const handleMaps = () => {
    window.open(config.mapsLink || 'https://maps.google.com', '_blank');
  };

  const GrupoCard = ({ grupo, principal }) => (
    <div
      key={grupo.id}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 16px',
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '8px',
      }}
    >
      {/* Ícone */}
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: grupo.cor, border: `1px solid ${grupo.corBorda}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <i className={`ph ${grupo.icone}`} style={{ fontSize: '1.3rem', color: grupo.corTexto }}></i>
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', margin: 0, marginBottom: '2px' }}>
          {grupo.nome}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {grupo.descricao}
        </p>
      </div>

      {/* Botão */}
      <button
        onClick={() => handleWhatsApp(grupo)}
        style={{
          flexShrink: 0, width: '40px', height: '40px', borderRadius: '50%',
          background: 'rgba(37,211,102,0.15)', border: '1px solid rgba(37,211,102,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
        }}
        title="Entrar no grupo via WhatsApp"
      >
        <i className="ph ph-whatsapp-logo" style={{ fontSize: '1.2rem', color: '#25d366' }}></i>
      </button>
    </div>
  );

  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Grupos & Células" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>

        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', lineHeight: 1.6 }}>
          Faça parte de um grupo e cresça junto com a família IFPA.
        </p>

        {/* Endereço da Igreja */}
        <section className="glass-card" style={{ marginBottom: 'var(--spacing-lg)', display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius-md)', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <i className="ph ph-church" style={{ fontSize: '1.4rem', color: 'var(--accent-color)' }}></i>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>Igreja Foi Por Amor</p>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '2px' }}>{config.endereco}</p>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{config.cidade}</p>
          </div>
          <button
            onClick={handleMaps}
            style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-full)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', whiteSpace: 'nowrap' }}
          >
            <i className="ph ph-map-pin"></i> Mapa
          </button>
        </section>

        {/* Grupos Principais */}
        <h3 className="section-title" style={{ marginTop: 0 }}>Grupos da Igreja</h3>
        {GRUPOS_PRINCIPAIS.map(g => <GrupoCard key={g.id} grupo={g} principal />)}

        {/* Grupos Abertos */}
        <h3 className="section-title" style={{ marginTop: 'var(--spacing-lg)' }}>Grupos em que você pode entrar</h3>
        {GRUPOS_ABERTOS.map(g => <GrupoCard key={g.id} grupo={g} />)}

      </main>

      {toast && <Toast message={toast} icon="ph-info" type="info" onClose={() => setToast('')} />}
    </div>
  );
}
