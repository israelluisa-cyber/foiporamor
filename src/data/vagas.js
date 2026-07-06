import { saveVagasToSupabase } from './supabase';

export const VAGAS_KEY = 'voluntarios_vagas';

export const MINISTERIOS = [
  { nome: 'Bem-vindo',               icone: 'ph-hand-waving',        descricao: 'Recepção e acolhimento de visitantes e membros da igreja.' },
  { nome: 'Recepção / Hospitalidade', icone: 'ph-coffee',             descricao: 'Café, organização do espaço e apoio logístico nos cultos.' },
  { nome: 'Mídia e Transmissão',      icone: 'ph-video-camera',       descricao: 'Câmera, som e transmissão ao vivo dos cultos.' },
  { nome: 'Ministério Infantil',      icone: 'ph-baby',               descricao: 'Cuidar e ensinar as crianças durante os cultos.' },
  { nome: 'Escola Bíblica Dominical', icone: 'ph-chalkboard-teacher', descricao: 'Ensinar e discipular adultos na Palavra de Deus.' },
  { nome: 'Ação Social',              icone: 'ph-heart',              descricao: 'Distribuição de alimentos e assistência à comunidade.' },
];

export function loadVagas() {
  try { return JSON.parse(localStorage.getItem(VAGAS_KEY)) || []; }
  catch { return []; }
}

export function saveVagas(vagas) {
  localStorage.setItem(VAGAS_KEY, JSON.stringify(vagas));
  saveVagasToSupabase(vagas);
}
