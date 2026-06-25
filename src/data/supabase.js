import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

// -------------------------------------------------------
// Sync: puxa dados do Supabase e atualiza localStorage
// Chamado uma vez na inicialização do app
// -------------------------------------------------------
export async function syncFromSupabase() {
  if (!supabase) return;
  try {
    const [
      { data: membros },
      { data: contribuicoes },
      { data: cadastros },
      { data: avisos },
      { data: oracao },
      { data: testemunhos },
      { data: visitantes },
      { data: aconselhamento },
    ] = await Promise.all([
      supabase.from('membros').select('*').order('created_at'),
      supabase.from('contribuicoes').select('*').order('created_at', { ascending: false }),
      supabase.from('cadastros').select('*').order('created_at', { ascending: false }),
      supabase.from('avisos').select('*').order('created_at', { ascending: false }),
      supabase.from('pedidos_oracao').select('*').order('created_at', { ascending: false }),
      supabase.from('testemunhos').select('*').order('created_at', { ascending: false }),
      supabase.from('visitantes').select('*').order('created_at', { ascending: false }),
      supabase.from('pedidos_aconselhamento').select('*').order('created_at', { ascending: false }),
    ]);

    if (membros?.length)        localStorage.setItem('membros_data',            JSON.stringify(mapMembros(membros)));
    if (contribuicoes?.length)  localStorage.setItem('contribuicoes',           JSON.stringify(mapContribuicoes(contribuicoes)));
    if (cadastros?.length)      localStorage.setItem('cadastros_pendentes',     JSON.stringify(cadastros));
    if (avisos?.length)         localStorage.setItem('admin_avisos',            JSON.stringify(avisos));
    if (oracao?.length)         localStorage.setItem('pedidos_oracao',          JSON.stringify(oracao));
    if (testemunhos?.length)    localStorage.setItem('testemunhos_lista',       JSON.stringify(mapTestemunhos(testemunhos)));
    if (visitantes?.length)     localStorage.setItem('visitantes',              JSON.stringify(visitantes));
    if (aconselhamento?.length) localStorage.setItem('pedidos_aconselhamento',  JSON.stringify(aconselhamento));
  } catch (e) {
    console.warn('[Supabase] Sync falhou, usando dados locais:', e.message);
  }
}

// -------------------------------------------------------
// Mapeamento: snake_case do banco → camelCase do app
// -------------------------------------------------------
function mapMembros(rows) {
  return rows.map(r => ({
    id: r.id,
    nome: r.nome,
    cargo: r.cargo,
    celula: r.celula,
    bairro: r.bairro,
    foto: r.foto,
    dataNascimento: r.data_nascimento,
  }));
}

function mapContribuicoes(rows) {
  return rows.map(r => ({
    id: r.id,
    tipo: r.tipo,
    valorNum: r.valor_num,
    valorFormatado: r.valor_formatado,
    data: r.data,
  }));
}

function mapTestemunhos(rows) {
  return rows.map(r => ({
    id: r.id,
    nome: r.nome,
    texto: r.texto,
    data: r.data,
    amens: r.amens || 0,
  }));
}
