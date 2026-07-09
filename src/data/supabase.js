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
// Cadastros: salva novo cadastro de membro no Supabase
// -------------------------------------------------------
export async function saveCadastroToSupabase(cadastro) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('cadastros').upsert({
      id:              String(cadastro.id),
      nome:            cadastro.nome            || null,
      email:           cadastro.email           || null,
      celular:         cadastro.celular         || null,
      data_nascimento: cadastro.dataNascimento  || null,
      bairro:          cadastro.bairro          || null,
      celula:          cadastro.celula          || null,
      experiencia:     cadastro.experiencia     || null,
      foto:            cadastro.foto            || null,
      password_hash:   cadastro.passwordHash    || null,
      password_salt:   cadastro.passwordSalt    || null,
      status:          cadastro.status          || 'pendente',
      data_cadastro:   cadastro.dataCadastro    || null,
    });
    if (error) throw error;
    return true;
  } catch (e) {
    console.warn('[Supabase] Erro ao salvar cadastro:', e.message);
    return false;
  }
}

export async function updateCadastroStatusSupabase(id, status) {
  if (!supabase) return;
  try {
    await supabase.from('cadastros').update({ status }).eq('id', String(id));
  } catch (e) {
    console.warn('[Supabase] Erro ao atualizar cadastro:', e.message);
  }
}

export async function updateCadastroSenhaSupabase(id, passwordHash, passwordSalt) {
  if (!supabase) return;
  try {
    await supabase.from('cadastros')
      .update({ password_hash: passwordHash, password_salt: passwordSalt, password: null })
      .eq('id', String(id));
  } catch (e) {
    console.warn('[Supabase] Erro ao migrar senha do cadastro:', e.message);
  }
}

// -------------------------------------------------------
// Config: salva a configuração do app no Supabase
// para sincronizar entre dispositivos
// -------------------------------------------------------
export async function saveConfigToSupabase(config) {
  if (!supabase) return;
  try {
    await supabase.from('app_config').upsert({
      id: 'main',
      data: config,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Supabase] Erro ao salvar config:', e.message);
  }
}

// -------------------------------------------------------
// Teologia (ITEAP): salva os dados do curso no Supabase
// reaproveitando a tabela "app_config" com id próprio
// -------------------------------------------------------
export async function saveTeologiaToSupabase(data) {
  if (!supabase) return;
  try {
    await supabase.from('app_config').upsert({
      id: 'teologia',
      data,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Supabase] Erro ao salvar teologia:', e.message);
  }
}

// -------------------------------------------------------
// Evangelismo: salva as saídas no Supabase
// reaproveitando a tabela "app_config" com id próprio
// -------------------------------------------------------
export async function saveEvangelismoToSupabase(data) {
  if (!supabase) return;
  try {
    await supabase.from('app_config').upsert({
      id: 'evangelismo',
      data,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Supabase] Erro ao salvar evangelismo:', e.message);
  }
}

// -------------------------------------------------------
// Ministérios: salva a lista de ministérios no Supabase
// reaproveitando a tabela "app_config" com id próprio
// -------------------------------------------------------
export async function saveMinisteriosToSupabase(data) {
  if (!supabase) return;
  try {
    await supabase.from('app_config').upsert({
      id: 'ministerios',
      data,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Supabase] Erro ao salvar ministérios:', e.message);
  }
}

// -------------------------------------------------------
// Vagas de voluntariado: salva no Supabase
// reaproveitando a tabela "app_config" com id próprio
// -------------------------------------------------------
export async function saveVagasToSupabase(data) {
  if (!supabase) return;
  try {
    await supabase.from('app_config').upsert({
      id: 'vagas',
      data,
      updated_at: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('[Supabase] Erro ao salvar vagas:', e.message);
  }
}

// -------------------------------------------------------
// Avisos (Comunicados): cria/exclui no Supabase
// -------------------------------------------------------
export async function saveAvisoToSupabase(aviso) {
  if (!supabase) return;
  try {
    await supabase.from('avisos').upsert({
      id:     String(aviso.id),
      tipo:   aviso.tipo   || null,
      titulo: aviso.titulo || null,
      texto:  aviso.texto,
      data:   aviso.data   || null,
      icone:  aviso.icone  || null,
    });
  } catch (e) {
    console.warn('[Supabase] Erro ao salvar aviso:', e.message);
  }
}

export async function deleteAvisoFromSupabase(id) {
  if (!supabase) return;
  try {
    await supabase.from('avisos').delete().eq('id', String(id));
  } catch (e) {
    console.warn('[Supabase] Erro ao excluir aviso:', e.message);
  }
}

// -------------------------------------------------------
// Pedidos de Oração: cria/exclui no Supabase
// -------------------------------------------------------
export async function savePedidoOracaoToSupabase(pedido) {
  if (!supabase) return;
  try {
    await supabase.from('pedidos_oracao').upsert({
      id:      String(pedido.id),
      texto:   pedido.texto,
      privado: !!pedido.privado,
      nome:    pedido.nome    || null,
      celular: pedido.celular || null,
      data:    pedido.data || null,
    });
  } catch (e) {
    console.warn('[Supabase] Erro ao salvar pedido de oração:', e.message);
  }
}

export async function deletePedidoOracaoFromSupabase(id) {
  if (!supabase) return;
  try {
    await supabase.from('pedidos_oracao').delete().eq('id', String(id));
  } catch (e) {
    console.warn('[Supabase] Erro ao excluir pedido de oração:', e.message);
  }
}

export async function clearPedidosOracaoFromSupabase() {
  if (!supabase) return;
  try {
    await supabase.from('pedidos_oracao').delete().neq('id', '');
  } catch (e) {
    console.warn('[Supabase] Erro ao limpar pedidos de oração:', e.message);
  }
}

// -------------------------------------------------------
// Visitantes: cria no Supabase
// -------------------------------------------------------
export async function saveVisitanteToSupabase(visita) {
  if (!supabase) return;
  try {
    await supabase.from('visitantes').upsert({
      id:       String(visita.id),
      nome:     visita.nome,
      telefone: visita.telefone || null,
      como:     visita.como     || null,
      data:     visita.data     || null,
    });
  } catch (e) {
    console.warn('[Supabase] Erro ao salvar visitante:', e.message);
  }
}

// -------------------------------------------------------
// Pedidos de Aconselhamento: atualiza/exclui no Supabase
// (a criação já sincroniza em Aconselhamento.jsx)
// -------------------------------------------------------
export async function updateAconselhamentoStatusSupabase(id, atendido) {
  if (!supabase) return;
  try {
    await supabase.from('pedidos_aconselhamento').update({ atendido }).eq('id', String(id));
  } catch (e) {
    console.warn('[Supabase] Erro ao atualizar aconselhamento:', e.message);
  }
}

export async function deleteAconselhamentoFromSupabase(id) {
  if (!supabase) return;
  try {
    await supabase.from('pedidos_aconselhamento').delete().eq('id', String(id));
  } catch (e) {
    console.warn('[Supabase] Erro ao excluir aconselhamento:', e.message);
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
      { data: appConfig },
      { data: teologiaConfig },
      { data: evangelismoConfig },
      { data: ministeriosConfig },
      { data: vagasConfig },
    ] = await Promise.all([
      supabase.from('membros').select('*').order('created_at'),
      supabase.from('contribuicoes').select('*').order('created_at', { ascending: false }),
      supabase.from('cadastros').select('*').order('created_at', { ascending: false }),
      supabase.from('avisos').select('*').order('created_at', { ascending: false }),
      supabase.from('pedidos_oracao').select('*').order('created_at', { ascending: false }),
      supabase.from('visitantes').select('*').order('created_at', { ascending: false }),
      supabase.from('pedidos_aconselhamento').select('*').order('created_at', { ascending: false }),
      supabase.from('app_config').select('data').eq('id', 'main').single(),
      supabase.from('app_config').select('data').eq('id', 'teologia').single(),
      supabase.from('app_config').select('data').eq('id', 'evangelismo').single(),
      supabase.from('app_config').select('data').eq('id', 'ministerios').single(),
      supabase.from('app_config').select('data').eq('id', 'vagas').single(),
    ]);

    if (membros?.length)        localStorage.setItem('membros_data',           JSON.stringify(mapMembros(membros)));
    if (contribuicoes?.length)  localStorage.setItem('contribuicoes',          JSON.stringify(mapContribuicoes(contribuicoes)));
    if (cadastros?.length)      localStorage.setItem('cadastros_pendentes',    JSON.stringify(mapCadastros(cadastros)));
    if (avisos?.length)         localStorage.setItem('admin_avisos',           JSON.stringify(avisos));
    if (oracao?.length)         localStorage.setItem('pedidos_oracao',         JSON.stringify(oracao));
    if (visitantes?.length)     localStorage.setItem('visitantes',             JSON.stringify(visitantes));
    if (aconselhamento?.length) localStorage.setItem('pedidos_aconselhamento', JSON.stringify(aconselhamento));
    if (appConfig?.data)        localStorage.setItem('igreja_config',          JSON.stringify(appConfig.data));
    if (teologiaConfig?.data)   localStorage.setItem('iteap_config',           JSON.stringify(teologiaConfig.data));
    if (evangelismoConfig?.data) localStorage.setItem('evangelismo_saidas',   JSON.stringify(evangelismoConfig.data));
    if (ministeriosConfig?.data) localStorage.setItem('ministerios_data',     JSON.stringify(ministeriosConfig.data));
    if (vagasConfig?.data)       localStorage.setItem('voluntarios_vagas',    JSON.stringify(vagasConfig.data));
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

function mapCadastros(rows) {
  return rows.map(r => ({
    id:              r.id,
    nome:            r.nome,
    email:           r.email,
    celular:         r.celular,
    dataNascimento:  r.data_nascimento,
    bairro:          r.bairro,
    celula:          r.celula,
    experiencia:     r.experiencia,
    foto:            r.foto,
    password:        r.password,
    passwordHash:    r.password_hash,
    passwordSalt:    r.password_salt,
    status:          r.status,
    dataCadastro:    r.data_cadastro,
    isAdmin:         r.is_admin || false,
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

