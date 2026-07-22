// Busca automática da última pregação publicada no canal do YouTube da igreja
// (YouTube Data API v3) — usa a mesma chave/link já configurados no Admin.
// Guarda em cache local pra não estourar a cota da API a cada abertura do app;
// como a igreja precisa subir o vídeo no YouTube depois do culto, "atualizar
// sozinho" aqui significa "a próxima vez que o app checar, já pega o novo".

const CACHE_KEY = 'igreja_ultima_pregacao_cache';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

export function extractCanalYoutube(youtubeLink) {
  if (!youtubeLink) return null;
  const porId = youtubeLink.match(/\/channel\/(UC[\w-]+)/);
  if (porId) return { tipo: 'id', valor: porId[1] };
  const porHandle = youtubeLink.match(/\/@([\w.-]+)/);
  if (porHandle) return { tipo: 'handle', valor: `@${porHandle[1]}` };
  return null;
}

export function urlTodosVideos(canal) {
  if (!canal) return null;
  return canal.tipo === 'id'
    ? `https://www.youtube.com/channel/${canal.valor}/videos`
    : `https://www.youtube.com/${canal.valor}/videos`;
}

function parseDuracaoISO8601(iso) {
  const m = (iso || '').match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return '';
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  const pad = n => String(n).padStart(2, '0');
  return h > 0 ? `${h}:${pad(min)}:${pad(s)}` : `${min}:${pad(s)}`;
}

async function resolveUploadsPlaylistId(apiKey, canal) {
  const params = new URLSearchParams({ key: apiKey, part: 'contentDetails' });
  if (canal.tipo === 'id') params.set('id', canal.valor);
  else params.set('forHandle', canal.valor);
  const res = await fetch(`https://www.googleapis.com/youtube/v3/channels?${params}`);
  if (!res.ok) throw new Error('Falha ao resolver o canal do YouTube');
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) throw new Error('Canal do YouTube não encontrado');
  return item.contentDetails.relatedPlaylists.uploads;
}

async function fetchUltimoVideoDoCanal(apiKey, playlistId) {
  const params = new URLSearchParams({ key: apiKey, part: 'snippet', playlistId, maxResults: '1' });
  const res = await fetch(`https://www.googleapis.com/youtube/v3/playlistItems?${params}`);
  if (!res.ok) throw new Error('Falha ao buscar os vídeos do canal');
  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;
  const videoId = item.snippet.resourceId.videoId;

  let duracao = '';
  try {
    const paramsVideo = new URLSearchParams({ key: apiKey, part: 'contentDetails', id: videoId });
    const resVideo = await fetch(`https://www.googleapis.com/youtube/v3/videos?${paramsVideo}`);
    const dataVideo = resVideo.ok ? await resVideo.json() : null;
    duracao = parseDuracaoISO8601(dataVideo?.items?.[0]?.contentDetails?.duration);
  } catch { /* duração é só um detalhe visual — segue sem ela se essa segunda chamada falhar */ }

  const thumb = item.snippet.thumbnails || {};
  return {
    videoId,
    titulo: item.snippet.title,
    thumbnail: thumb.maxres?.url || thumb.high?.url || thumb.medium?.url || thumb.default?.url || null,
    publicadoEm: item.snippet.publishedAt,
    duracao,
  };
}

function lerCache() {
  try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; }
}

// Domingo depois das 14h é quando o culto já acabou e o vídeo já deve estar
// no ar — retorna a data (YYYY-MM-DD) desse domingo, ou null se não for esse
// horário ainda. Usado só pra saber se já "conferimos esse domingo" ou não.
function domingoPosCultoStr() {
  const now = new Date();
  if (now.getDay() !== 0 || now.getHours() < 14) return null;
  const y = now.getFullYear(), m = String(now.getMonth() + 1).padStart(2, '0'), d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Retorna { videoId, titulo, thumbnail, publicadoEm, duracao } ou null.
export async function getUltimaPregacao(config) {
  if (!config.youtubeApiKey) return null;
  const canal = extractCanalYoutube(config.youtubeLink);
  if (!canal) return null;

  const cache = lerCache();
  const domingo = domingoPosCultoStr();
  // Depois das 14h de domingo, ignora o cache normal de algumas horas e força
  // uma checagem nova (o vídeo do culto já deve estar publicado) — mas só uma
  // vez por domingo, não a cada abertura do app.
  const precisaChecarDomingo = domingo && cache?.domingoChecado !== domingo;
  const cacheValido = !precisaChecarDomingo && cache?.buscadoEm && (Date.now() - cache.buscadoEm < CACHE_TTL_MS);

  if (cacheValido) return cache.dados;

  try {
    const playlistId = cache?.playlistId || await resolveUploadsPlaylistId(config.youtubeApiKey, canal);
    const dados = await fetchUltimoVideoDoCanal(config.youtubeApiKey, playlistId);
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      buscadoEm: Date.now(), dados, playlistId,
      domingoChecado: domingo || cache?.domingoChecado || null,
    }));
    return dados;
  } catch (e) {
    console.error('Última pregação (YouTube):', e);
    // Falha temporária (rede, cota, chave) — melhor mostrar o último dado bom
    // que já tínhamos do que sumir a seção inteira da Home.
    return cache?.dados || null;
  }
}
