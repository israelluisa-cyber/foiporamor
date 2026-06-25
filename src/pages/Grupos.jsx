import Header from '../components/Header';

const GRUPOS_PRINCIPAIS = [
  {
    id: 'membros',
    nome: 'Membros',
    descricao: 'Grupo geral da congregação da Igreja Foi Por Amor. Avisos, informações e comunhão.',
    icone: 'ph-users-three',
    cor: 'rgba(255,255,255,0.08)',
    corBorda: 'rgba(255,255,255,0.15)',
    corTexto: 'var(--text-primary)',
  },
  {
    id: 'obreiros',
    nome: 'Ministério de Obreiros - FPA',
    descricao: 'Equipe de diáconos e diaconisas que servem na casa de Deus com dedicação.',
    icone: 'ph-shield-star',
    cor: 'rgba(251,146,60,0.12)',
    corBorda: 'rgba(251,146,60,0.35)',
    corTexto: '#fb923c',
  },
  {
    id: 'iteap',
    nome: 'ITEAP - Instituto Teológico Amor e Palavra',
    descricao: 'Grupo dos alunos e professores do instituto teológico da Igreja Foi Por Amor.',
    icone: 'ph-book-open-text',
    cor: 'rgba(99,102,241,0.12)',
    corBorda: 'rgba(99,102,241,0.35)',
    corTexto: '#818cf8',
  },
  {
    id: 'jovens',
    nome: 'Coordenação Jovens - FPA',
    descricao: 'Espaço de organização e comunhão da coordenação do ministério de jovens.',
    icone: 'ph-lightning',
    cor: 'rgba(251,191,36,0.12)',
    corBorda: 'rgba(251,191,36,0.35)',
    corTexto: '#fbbf24',
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
  },
  {
    id: 'louvor',
    nome: 'Louvor e Adoração - FPA',
    descricao: 'Grupo do ministério de louvor e adoração da Igreja Foi Por Amor.',
    icone: 'ph-music-notes',
    cor: 'rgba(52,211,153,0.12)',
    corBorda: 'rgba(52,211,153,0.35)',
    corTexto: '#34d399',
  },
  {
    id: 'kids',
    nome: 'Ministério Kids - FPA',
    descricao: 'Equipe dedicada ao cuidado e ensino das crianças da Igreja Foi Por Amor.',
    icone: 'ph-baby',
    cor: 'rgba(251,191,36,0.12)',
    corBorda: 'rgba(251,191,36,0.35)',
    corTexto: '#fbbf24',
  },
  {
    id: 'evangelismo',
    nome: 'Evangelismo FPA',
    descricao: 'Equipe responsável pelas ações evangelísticas e alcance da nossa comunidade.',
    icone: 'ph-megaphone',
    cor: 'rgba(251,146,60,0.12)',
    corBorda: 'rgba(251,146,60,0.35)',
    corTexto: '#fb923c',
  },
  {
    id: 'musicos',
    nome: 'Músicos e Adoração - FPA',
    descricao: 'Grupo dos músicos instrumentistas que ministram nos cultos da igreja.',
    icone: 'ph-guitar',
    cor: 'rgba(99,102,241,0.12)',
    corBorda: 'rgba(99,102,241,0.35)',
    corTexto: '#818cf8',
  },
  {
    id: 'bemvindo',
    nome: 'Ministério "Bem-vindo" - FPA',
    descricao: 'Equipe de recepção e acolhimento de visitantes e novos membros.',
    icone: 'ph-hand-waving',
    cor: 'rgba(52,211,153,0.12)',
    corBorda: 'rgba(52,211,153,0.35)',
    corTexto: '#34d399',
  },
  {
    id: 'conselho',
    nome: 'Conselho Igreja - FPA',
    descricao: 'Conselho de líderes e presbíteros responsáveis pela governança da igreja.',
    icone: 'ph-crown',
    cor: 'rgba(251,191,36,0.12)',
    corBorda: 'rgba(251,191,36,0.35)',
    corTexto: '#fbbf24',
  },
  {
    id: 'professores',
    nome: 'Professores Kids - FPA',
    descricao: 'Equipe de professores voluntários que ensinam as crianças na Palavra de Deus.',
    icone: 'ph-chalkboard-teacher',
    cor: 'rgba(236,72,153,0.12)',
    corBorda: 'rgba(236,72,153,0.35)',
    corTexto: '#f472b6',
  },
  {
    id: 'midia',
    nome: 'Mídia Foi Por Amor',
    descricao: 'Equipe de comunicação, transmissão ao vivo, redes sociais e design da FPA.',
    icone: 'ph-broadcast',
    cor: 'rgba(99,102,241,0.12)',
    corBorda: 'rgba(99,102,241,0.35)',
    corTexto: '#818cf8',
  },
];

function GrupoCard({ grupo }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px 16px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      marginBottom: '8px',
    }}>
      <div style={{
        width: '48px', height: '48px', borderRadius: '50%',
        background: grupo.cor, border: `1px solid ${grupo.corBorda}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <i className={`ph ${grupo.icone}`} style={{ fontSize: '1.3rem', color: grupo.corTexto }}></i>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', margin: '0 0 2px' }}>
          {grupo.nome}
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
          {grupo.descricao}
        </p>
      </div>
    </div>
  );
}

export default function Grupos() {
  return (
    <div className="container" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <Header title="Grupos & Ministérios" backButton={true} />

      <main style={{ paddingTop: 'var(--spacing-md)' }}>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: 'var(--spacing-lg)', lineHeight: 1.6 }}>
          Conheça os grupos e ministérios que fazem parte da família IFPA.
        </p>

        <h3 className="section-title" style={{ marginTop: 0 }}>Grupos da Igreja</h3>
        {GRUPOS_PRINCIPAIS.map(g => <GrupoCard key={g.id} grupo={g} />)}

        <h3 className="section-title" style={{ marginTop: 'var(--spacing-lg)' }}>Ministérios</h3>
        {GRUPOS_ABERTOS.map(g => <GrupoCard key={g.id} grupo={g} />)}
      </main>
    </div>
  );
}
