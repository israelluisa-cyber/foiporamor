import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && key ? createClient(url, key) : null;

// -------------------------------------------------------
// Storage: faz upload de base64 para o bucket "fotos"
// e retorna a URL pública. Nunca lança exceção — em caso
// de falha retorna o base64 original como fallback.
// -------------------------------------------------------
function base64ToBlob(dataUrl) {
  const [header, data] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)[1];
  const binary = atob(data);
  const arr = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export async function uploadFotoToStorage(base64DataUrl, pasta = 'geral') {
  if (!supabase || !base64DataUrl) return base64DataUrl;
  if (!base64DataUrl.startsWith('data:')) return base64DataUrl; // já é URL
  try {
    const blob = base64ToBlob(base64DataUrl);
    const filename = `${pasta}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from('fotos')
      .upload(filename, blob, { contentType: 'image/jpeg', upsert: false });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('fotos').getPublicUrl(filename);
    return publicUrl;
  } catch (e) {
    console.warn('[Storage] Upload falhou, usando base64:', e.message);
    return base64DataUrl;
  }
}

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
      { data: visitantes },
      { data: aconselhamento },
    ] = await Promise.all([
      supabase.from('membros').select('*').order('created_at'),
      supabase.from('contribuicoes').select('*').order('created_at', { ascending: false }),
      supabase.from('cadastros').select('*').order('created_at', { ascending: false }),
      supabase.from('avisos').select('*').order('created_at', { ascending: false }),
      supabase.from('pedidos_oracao').select('*').order('created_at', { ascending: false }),
      supabase.from('visitantes').select('*').order('created_at', { ascending: false }),
      supabase.from('pedidos_aconselhamento').select('*').order('created_at', { ascending: false }),
    ]);

    if (membros?.length)        localStorage.setItem('membros_data',           JSON.stringify(mapMembros(membros)));
    if (contribuicoes?.length)  localStorage.setItem('contribuicoes',          JSON.stringify(mapContribuicoes(contribuicoes)));
    if (cadastros?.length)      localStorage.setItem('cadastros_pendentes',    JSON.stringify(cadastros));
    if (avisos?.length)         localStorage.setItem('admin_avisos',           JSON.stringify(avisos));
    if (oracao?.length)         localStorage.setItem('pedidos_oracao',         JSON.stringify(oracao));
    if (visitantes?.length)     localStorage.setItem('visitantes',             JSON.stringify(visitantes));
    if (aconselhamento?.length) localStorage.setItem('pedidos_aconselhamento', JSON.stringify(aconselhamento));
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

