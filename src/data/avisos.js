import { deleteAvisoFromSupabase } from './supabase';

const READ_KEY = 'avisos_lidos';
const ADMIN_AVISOS_KEY = 'admin_avisos';

export const TIPO_CORES = {
  Urgente:     { bg: 'rgba(220,38,38,0.15)',  border: 'rgba(220,38,38,0.4)',  text: '#ef4444' },
  Evento:      { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.2)', text: 'var(--text-primary)' },
  Informativo: { bg: 'rgba(255,255,255,0.04)', border: 'var(--border-color)',   text: 'var(--text-secondary)' },
};

function loadAdminAvisos() {
  try { return JSON.parse(localStorage.getItem(ADMIN_AVISOS_KEY)) || []; }
  catch { return []; }
}

// Válido só no próprio dia — some assim que a data passa (vira o dia seguinte).
export function isAvisoValido(aviso) {
  try {
    const [dia, mes, ano] = aviso.data.split('/').map(Number);
    const fimDoDia = new Date(ano, mes - 1, dia, 23, 59, 59, 999).getTime();
    return Date.now() <= fimDoDia;
  } catch { return true; }
}

// Apaga (localStorage + Supabase) os comunicados do admin com mais de
// duas semanas — chamado uma vez a cada carregamento do app.
export function limparAvisosExpirados() {
  const admin = loadAdminAvisos();
  const expirados = admin.filter(a => !isAvisoValido(a));
  if (expirados.length === 0) return;
  const validos = admin.filter(isAvisoValido);
  localStorage.setItem(ADMIN_AVISOS_KEY, JSON.stringify(validos));
  expirados.forEach(a => deleteAvisoFromSupabase(a.id));
}

// Lista única de avisos válidos (comunicados do admin), mais recentes primeiro —
// fonte compartilhada pela página /avisos, o contador de não lidos e o painel da Home.
export function loadAvisosValidos() {
  return loadAdminAvisos().filter(isAvisoValido);
}

export function getUnreadCount() {
  try {
    const lidos = (JSON.parse(localStorage.getItem(READ_KEY)) || []).map(String);
    const todos = loadAvisosValidos();
    return todos.filter(a => !lidos.includes(String(a.id))).length;
  } catch { return 0; }
}

export function marcarAvisosComoLidos(avisos) {
  localStorage.setItem(READ_KEY, JSON.stringify(avisos.map(a => String(a.id))));
}
