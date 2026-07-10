import { saveGruposToSupabase } from './supabase';

const KEY = 'grupos_data';

export const DEFAULT_GRUPOS = [
  {
    id: 'membros',
    nome: 'Membros',
    descricao: 'Grupo geral da congregação. Avisos, informações e comunhão.',
    icone: 'ph-users-three',
    cor: 'rgba(255,255,255,0.08)',
    corBorda: 'rgba(255,255,255,0.15)',
    corTexto: '#ffffff',
    categoria: 'principal',
  },
  {
    id: 'obreiros',
    nome: 'Ministério de Obreiros',
    descricao: 'Equipe de diáconos e diaconisas que servem na casa de Deus com dedicação.',
    icone: 'ph-shield-star',
    cor: 'rgba(251,146,60,0.12)',
    corBorda: 'rgba(251,146,60,0.35)',
    corTexto: '#fb923c',
    categoria: 'principal',
  },
  {
    id: 'iteap',
    nome: 'ITEAP - Instituto Teológico',
    descricao: 'Grupo dos alunos e professores do instituto teológico.',
    icone: 'ph-book-open-text',
    cor: 'rgba(99,102,241,0.12)',
    corBorda: 'rgba(99,102,241,0.35)',
    corTexto: '#818cf8',
    categoria: 'principal',
  },
  {
    id: 'jovens',
    nome: 'Coordenação Jovens',
    descricao: 'Espaço de organização e comunhão da coordenação do ministério de jovens.',
    icone: 'ph-lightning',
    cor: 'rgba(251,191,36,0.12)',
    corBorda: 'rgba(251,191,36,0.35)',
    corTexto: '#fbbf24',
    categoria: 'principal',
  },
  {
    id: 'anas',
    nome: 'Anas (Ministério de Mulheres)',
    descricao: 'Ministério dedicado às mulheres da igreja, promovendo comunhão, fé e identidade.',
    icone: 'ph-flower-lotus',
    cor: 'rgba(236,72,153,0.12)',
    corBorda: 'rgba(236,72,153,0.35)',
    corTexto: '#f472b6',
    categoria: 'aberto',
  },
  {
    id: 'louvor',
    nome: 'Louvor e Adoração',
    descricao: 'Grupo do ministério de louvor e adoração.',
    icone: 'ph-music-notes',
    cor: 'rgba(52,211,153,0.12)',
    corBorda: 'rgba(52,211,153,0.35)',
    corTexto: '#34d399',
    categoria: 'aberto',
  },
  {
    id: 'kids',
    nome: 'Ministério Kids',
    descricao: 'Equipe dedicada ao cuidado e ensino das crianças da igreja.',
    icone: 'ph-baby',
    cor: 'rgba(251,191,36,0.12)',
    corBorda: 'rgba(251,191,36,0.35)',
    corTexto: '#fbbf24',
    categoria: 'aberto',
  },
  {
    id: 'evangelismo',
    nome: 'Evangelismo',
    descricao: 'Equipe responsável pelas ações evangelísticas e alcance da nossa comunidade.',
    icone: 'ph-megaphone',
    cor: 'rgba(251,146,60,0.12)',
    corBorda: 'rgba(251,146,60,0.35)',
    corTexto: '#fb923c',
    categoria: 'aberto',
  },
  {
    id: 'musicos',
    nome: 'Músicos e Adoração',
    descricao: 'Grupo dos músicos instrumentistas que ministram nos cultos da igreja.',
    icone: 'ph-guitar',
    cor: 'rgba(99,102,241,0.12)',
    corBorda: 'rgba(99,102,241,0.35)',
    corTexto: '#818cf8',
    categoria: 'aberto',
  },
  {
    id: 'bemvindo',
    nome: 'Ministério "Bem-vindo"',
    descricao: 'Equipe de recepção e acolhimento de visitantes e novos membros.',
    icone: 'ph-hand-waving',
    cor: 'rgba(52,211,153,0.12)',
    corBorda: 'rgba(52,211,153,0.35)',
    corTexto: '#34d399',
    categoria: 'aberto',
  },
  {
    id: 'conselho',
    nome: 'Conselho da Igreja',
    descricao: 'Conselho de líderes e presbíteros responsáveis pela governança da igreja.',
    icone: 'ph-crown',
    cor: 'rgba(251,191,36,0.12)',
    corBorda: 'rgba(251,191,36,0.35)',
    corTexto: '#fbbf24',
    categoria: 'aberto',
  },
  {
    id: 'professores',
    nome: 'Professores Kids',
    descricao: 'Equipe de professores voluntários que ensinam as crianças na Palavra de Deus.',
    icone: 'ph-chalkboard-teacher',
    cor: 'rgba(236,72,153,0.12)',
    corBorda: 'rgba(236,72,153,0.35)',
    corTexto: '#f472b6',
    categoria: 'aberto',
  },
  {
    id: 'midia',
    nome: 'Mídia',
    descricao: 'Equipe de comunicação, transmissão ao vivo, redes sociais e design.',
    icone: 'ph-broadcast',
    cor: 'rgba(99,102,241,0.12)',
    corBorda: 'rgba(99,102,241,0.35)',
    corTexto: '#818cf8',
    categoria: 'aberto',
  },
];

export function loadGrupos() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved || !saved.length) return DEFAULT_GRUPOS;
    return saved;
  } catch { return DEFAULT_GRUPOS; }
}

export function saveGrupos(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  saveGruposToSupabase(data);
}

export const GRUPO_COLOR_PRESETS = [
  { label: 'Branco',  cor: 'rgba(255,255,255,0.08)', corBorda: 'rgba(255,255,255,0.15)', corTexto: '#ffffff' },
  { label: 'Laranja', cor: 'rgba(251,146,60,0.12)',   corBorda: 'rgba(251,146,60,0.35)',  corTexto: '#fb923c' },
  { label: 'Índigo',  cor: 'rgba(99,102,241,0.12)',   corBorda: 'rgba(99,102,241,0.35)',  corTexto: '#818cf8' },
  { label: 'Âmbar',   cor: 'rgba(251,191,36,0.12)',   corBorda: 'rgba(251,191,36,0.35)',  corTexto: '#fbbf24' },
  { label: 'Rosa',    cor: 'rgba(236,72,153,0.12)',   corBorda: 'rgba(236,72,153,0.35)',  corTexto: '#f472b6' },
  { label: 'Verde',   cor: 'rgba(52,211,153,0.12)',   corBorda: 'rgba(52,211,153,0.35)',  corTexto: '#34d399' },
];
