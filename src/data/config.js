export const CONFIG_KEY = 'igreja_config';

export const DEFAULT_CONFIG = {
  nomeIgreja:  'Igreja Foi Por Amor',
  nomeCurto:   'IFPA', // abreviação usada no splash e em textos curtos
  endereco:    'Rua da Igreja, 100 — Centro',
  cidade:      'Sua Cidade — SP',
  mapsLink:    'https://maps.google.com/?q=Igreja+Foi+Por+Amor',
  enderecoFoto:   '/endereco-foto.jpg', // base64/URL ou null — foto exibida no card "Onde nos encontrar" (recomendado 16:9)
  palavraDiaFoto: null, // base64/URL ou null — foto de fundo do card "Palavra do Dia" (recomendado 16:9)
  heroBg:         null, // base64 ou null (usa /hero_bg.png)
  heroBgPosition: 'center',
  youtubeLink: 'https://www.youtube.com/@IgrejaFoiPorAmorOficial/live',
  youtubeApiKey: '', // chave da YouTube Data API v3 — usada só pra buscar a "Última Pregação" automaticamente
  pixKey:         'igrejafoiporamor@exemplo.com.br',
  pixNome:        '', // razão social/nome do favorecido da chave PIX geral — exibido para conferência
  pixCnpj:        '', // CNPJ do favorecido da chave PIX geral — exibido para conferência
  pixKeyTeologia: '', // chave PIX exclusiva do curso de teologia — se vazio, usa pixKey
  pixNomeTeologia: '', // razão social/nome do favorecido da chave PIX do curso de teologia
  pixCnpjTeologia: '', // CNPJ do favorecido da chave PIX do curso de teologia
  logoUrl:        null, // base64/URL ou null (usa /logo-icon.png)
  corDestaque:    '#fbbf24',
  instagramLink:  'https://www.instagram.com/igrejafoiporamor/',
  facebookLink:   'https://www.facebook.com/igrejafpa',
  whatsappPastor: '',
  cultos: [
    { id: 1, diaSemana: 2, hora: 19, min: 30, horaFim: 21, minFim: 0, nome: 'Curso de Teologia',              ativo: true,  restrito: false, foto: null },
    { id: 2, diaSemana: 4, hora: 19, min: 30, horaFim: 21, minFim: 0, nome: 'Culto de Oração e Adoração',     ativo: true,  restrito: false, foto: null },
    { id: 3, diaSemana: 5, hora: 19, min: 30, horaFim: 21, minFim: 0, nome: 'Ensaio do Ministério de Louvor', ativo: true,  restrito: false, foto: null },
    { id: 4, diaSemana: 0, hora: 10, min:  0, horaFim: 12, minFim: 0, nome: 'Culto de Celebração',            ativo: true,  restrito: false, foto: null },
  ],
  obras: [
    { id: 'cancer',  nome: 'Casa de Crianças com Câncer', descricao: 'Visitamos e apoiamos famílias de crianças em tratamento oncológico, levando cuidado pastoral, amor e suporte emocional nos momentos mais difíceis.', icone: 'ph-heart', gradiente: 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)', foto: null },
    { id: 'marmita', nome: 'Marmita no Centro de SP',     descricao: 'Nossa equipe vai ao centro de São Paulo distribuir marmitas quentinhas e oração para moradores em situação de rua.', icone: 'ph-bowl-food', gradiente: 'linear-gradient(135deg, #ea580c 0%, #ca8a04 100%)', foto: null },
    { id: 'peniel',  nome: 'Casa Peniel',                  descricao: 'Lar de acolhimento e recuperação para homens em situação de vulnerabilidade social, oferecendo moradia, alimentação e restauração espiritual.', icone: 'ph-house-line', gradiente: 'linear-gradient(135deg, #0369a1 0%, #0f766e 100%)', foto: null },
    { id: 'festas',  nome: 'Dia das Crianças & Páscoa',   descricao: 'Nas datas comemorativas levamos alegria, presentes e o amor de Jesus a crianças em situação de vulnerabilidade social, criando memórias e transformando vidas.', icone: 'ph-smiley', gradiente: 'linear-gradient(135deg, #d97706 0%, #ec4899 100%)', foto: null },
  ],
};

export function loadConfig() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG_KEY));
    if (!saved) return DEFAULT_CONFIG;
    const obras = saved.obras && saved.obras.length
      ? DEFAULT_CONFIG.obras.map(o => ({ ...o, ...((saved.obras || []).find(s => s.id === o.id) || {}) }))
      : DEFAULT_CONFIG.obras;
    return {
      ...DEFAULT_CONFIG,
      ...saved,
      whatsappPastor: saved.whatsappPastor ?? DEFAULT_CONFIG.whatsappPastor,
      whatsapp: { ...DEFAULT_CONFIG.whatsapp, ...(saved.whatsapp || {}) },
      cultos: saved.cultos && saved.cultos.length
      ? DEFAULT_CONFIG.cultos.map(c => ({ ...c, ...((saved.cultos || []).find(s => s.id === c.id) || {}) }))
      : DEFAULT_CONFIG.cultos,
      obras,
    };
  } catch { return DEFAULT_CONFIG; }
}

export function saveConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

// Ajusta cor derivada (mais escura) para o efeito hover do accent-color
function shadeColor(hex, percent) {
  try {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + percent));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + percent));
    const b = Math.max(0, Math.min(255, (num & 0x0000ff) + percent));
    return `#${(0x1000000 + r * 0x10000 + g * 0x100 + b).toString(16).slice(1)}`;
  } catch { return hex; }
}

// Aplica a identidade visual (nome, logo, cor, meta tags) em runtime —
// usado tanto no boot do app quanto logo após o admin salvar as configurações.
export function applyBranding(config) {
  if (typeof document === 'undefined') return;

  document.title = config.nomeIgreja || DEFAULT_CONFIG.nomeIgreja;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', `App da ${config.nomeIgreja} — programação, oração, devocional e muito mais.`);

  const metaAppleTitle = document.querySelector('meta[name="apple-mobile-web-app-title"]');
  if (metaAppleTitle) metaAppleTitle.setAttribute('content', config.nomeCurto || DEFAULT_CONFIG.nomeCurto);

  if (config.corDestaque) {
    const root = document.documentElement.style;
    root.setProperty('--accent-color', config.corDestaque);
    root.setProperty('--accent-hover', shadeColor(config.corDestaque, -25));
    root.setProperty('--accent-glow', `${config.corDestaque}26`); // ~15% de opacidade
  }

  const splashLogo  = document.getElementById('splash-logo');
  const splashTitle = document.getElementById('splash-title');
  const splashSub   = document.getElementById('splash-sub');
  if (splashLogo)  splashLogo.src = config.logoUrl || '/logo.jpeg';
  if (splashTitle) splashTitle.textContent = config.nomeIgreja || DEFAULT_CONFIG.nomeIgreja;
  if (splashSub)   splashSub.textContent = config.nomeCurto || DEFAULT_CONFIG.nomeCurto;
}

export const DIAS_SEMANA = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
export const DIAS_ABBR   = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'];

export function formatHora(h, m) {
  return `${h}h${m > 0 ? String(m).padStart(2, '0') : '00'}`;
}

export function cultoIcon(nome) {
  const n = (nome || '').toLowerCase();
  if (n.includes('teologia') || n.includes('curso'))    return 'ph-graduation-cap';
  if (n.includes('ensino') || n.includes('estudo'))     return 'ph-book-open';
  if (n.includes('oração') || n.includes('adoração'))   return 'ph-hands-praying';
  if (n.includes('louvor') || n.includes('ensaio'))     return 'ph-music-notes';
  if (n.includes('celebração'))                          return 'ph-church';
  return 'ph-calendar';
}
