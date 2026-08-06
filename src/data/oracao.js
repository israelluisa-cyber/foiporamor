import { deletePedidoOracaoFromSupabase } from './supabase';
import { loadConfig } from './config';

const STORAGE_KEY = 'pedidos_oracao';

export function loadPedidos() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; }
  catch { return []; }
}

// Converte "dd/mm/aaaa" para timestamp; retorna null se não der pra interpretar.
function parseDataBR(str) {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(str || '');
  if (!m) return null;
  const [, dia, mes, ano] = m;
  return new Date(Number(ano), Number(mes) - 1, Number(dia)).getTime();
}

// Timestamp do fim do último Culto de Oração (quinta-feira) que já aconteceu.
// Se hoje é quinta e o culto desta semana ainda não terminou, usa a quinta anterior.
export function ultimoCultoOracaoMs() {
  const cultos = loadConfig().cultos || [];
  const culto  = cultos.find(c => c.diaSemana === 4); // 4 = quinta-feira
  if (!culto) return null;
  const now       = new Date();
  const daysBack  = (now.getDay() - 4 + 7) % 7;
  const candidate = new Date(now);
  candidate.setDate(now.getDate() - daysBack);
  candidate.setHours(culto.horaFim, culto.minFim, 0, 0);
  if (candidate.getTime() > now.getTime()) candidate.setDate(candidate.getDate() - 7);
  return candidate.getTime();
}

// Já foi intercedido no último Culto de Oração → deve sumir de vez.
// Sem data legível, considera NÃO intercedido (evita apagar por engano).
// corte é calculado uma única vez por quem chama em lote (ex.: limparPedidosOracaoIntercedidos)
// pra não recalcular a mesma conta pra cada pedido da lista.
export function jaFoiIntercedido(pedido, corte = ultimoCultoOracaoMs()) {
  if (!corte) return false;
  const ts = parseDataBR(pedido.data);
  return ts !== null && ts < corte;
}

// Apaga de vez (localStorage + Supabase) os pedidos já intercedidos na última
// quinta-feira — chamado uma vez a cada carregamento do app, mesmo padrão do
// limparAvisosExpirados em avisos.js. Antes disso, o pedido só desaparecia do
// mural público (filtro de exibição) mas continuava existindo no servidor —
// então uma resincronização normal do Supabase trazia ele de volta pro
// localStorage, parecendo que "a oração voltou" sem ninguém ter reenviado nada.
export function limparPedidosOracaoIntercedidos() {
  const pedidos = loadPedidos();
  const corte = ultimoCultoOracaoMs();
  const intercedidos = pedidos.filter(p => jaFoiIntercedido(p, corte));
  if (intercedidos.length === 0) return;
  const restantes = pedidos.filter(p => !jaFoiIntercedido(p, corte));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(restantes));
  intercedidos.forEach(p => deletePedidoOracaoFromSupabase(p.id));
}
