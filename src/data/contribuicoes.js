import { supabase } from './supabase';

const KEY = 'contribuicoes';

export function loadContribuicoes() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

export function saveContribuicao({ tipo, valorNum, valorFormatado }) {
  const id = String(Date.now());
  const data = new Date().toLocaleDateString('pt-BR');
  const item = { id, tipo, valorNum, valorFormatado, data };

  const lista = loadContribuicoes();
  lista.unshift(item);
  localStorage.setItem(KEY, JSON.stringify(lista));

  _syncContribuicaoToSupabase(item);
}

export function clearContribuicoes() {
  localStorage.setItem(KEY, JSON.stringify([]));
  try { supabase?.from('contribuicoes').delete().neq('id', '').catch(() => {}); } catch { }
}

export function totalContribuicoes(lista) {
  return lista.reduce((sum, c) => sum + (c.valorNum || 0), 0);
}

export function totalPorObra(lista) {
  return lista.reduce((acc, c) => {
    acc[c.tipo] = (acc[c.tipo] || 0) + (c.valorNum || 0);
    return acc;
  }, {});
}

async function _syncContribuicaoToSupabase(item) {
  try {
    await supabase.from('contribuicoes').upsert({
      id: item.id,
      tipo: item.tipo,
      valor_num: item.valorNum,
      valor_formatado: item.valorFormatado,
      data: item.data,
    }, { onConflict: 'id' });
  } catch (e) {
    console.warn('[Supabase] Erro ao salvar contribuição:', e.message);
  }
}
