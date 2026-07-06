import { supabase } from './supabase';

export const MEMBROS_KEY = 'membros_data';

export const DEFAULT_MEMBROS = [
  { id: 1,  nome: 'Ana Paula Ferreira',    cargo: 'Membro',          celula: 'Lar de Paz',       bairro: 'Bairro Sul',     foto: null, dataNascimento: '1992-06-25' },
  { id: 2,  nome: 'Carlos Eduardo Lima',   cargo: 'Diácono',         celula: 'Geração de Fogo',  bairro: 'Centro',         foto: null, dataNascimento: '1988-03-15' },
  { id: 3,  nome: 'Fernanda Santos',       cargo: 'Membro',          celula: 'Lar de Paz',       bairro: 'Bairro Sul',     foto: null, dataNascimento: '1994-07-20' },
  { id: 4,  nome: 'Gabriel Oliveira',      cargo: 'Líder de Célula', celula: 'Geração de Fogo',  bairro: 'Centro',         foto: null, dataNascimento: '1995-06-27' },
  { id: 5,  nome: 'Helena Costa',          cargo: 'Diaconisa',       celula: 'Lar de Paz',       bairro: 'Bairro Norte',   foto: null, dataNascimento: '1980-01-08' },
  { id: 6,  nome: 'João Pedro Almeida',    cargo: 'Músico',          celula: 'Geração de Fogo',  bairro: 'Centro',         foto: null, dataNascimento: '1997-09-10' },
  { id: 7,  nome: 'Juliana Rodrigues',     cargo: 'Voluntária',      celula: 'Lar de Paz',       bairro: 'Bairro Sul',     foto: null, dataNascimento: '1991-11-22' },
  { id: 8,  nome: 'Lucas Mendes',          cargo: 'Membro',          celula: 'Geração de Fogo',  bairro: 'Bairro Leste',   foto: null, dataNascimento: '1999-02-18' },
  { id: 9,  nome: 'Mariana Silva',         cargo: 'Membro',          celula: 'Lar de Paz',       bairro: 'Centro',         foto: null, dataNascimento: '1993-08-05' },
  { id: 10, nome: 'Paulo Roberto Gomes',   cargo: 'Presbítero',      celula: 'Lar de Paz',       bairro: 'Bairro Norte',   foto: null, dataNascimento: '1975-04-30' },
];

export function loadMembros() {
  try { return JSON.parse(localStorage.getItem(MEMBROS_KEY)) || DEFAULT_MEMBROS; }
  catch { return DEFAULT_MEMBROS; }
}

export function saveMembros(membros) {
  localStorage.setItem(MEMBROS_KEY, JSON.stringify(membros));
  _syncMembrosToSupabase(membros);
}

export async function deleteMembroSupabase(id) {
  try {
    await supabase.from('membros').delete().eq('id', String(id));
  } catch (e) {
    console.warn('[Supabase] Erro ao excluir membro:', e.message);
  }
}

async function _syncMembrosToSupabase(membros) {
  try {
    const rows = membros.map(m => ({
      id: String(m.id),
      nome: m.nome,
      cargo: m.cargo || null,
      celula: m.celula || null,
      bairro: m.bairro || null,
      foto: m.foto || null,
      data_nascimento: m.dataNascimento || null,
    }));
    await supabase.from('membros').upsert(rows, { onConflict: 'id' });
  } catch (e) {
    console.warn('[Supabase] Erro ao salvar membros:', e.message);
  }
}
