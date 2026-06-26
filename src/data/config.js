export const CONFIG_KEY = 'igreja_config';

export const DEFAULT_CONFIG = {
  nomeIgreja:  'Igreja Foi Por Amor',
  endereco:    'Rua da Igreja, 100 — Centro',
  cidade:      'Sua Cidade — SP',
  mapsLink:    'https://maps.google.com/?q=Igreja+Foi+Por+Amor',
  heroBg:         null, // base64 ou null (usa /hero_bg.png)
  heroBgPosition: 'center',
  youtubeLink: 'https://www.youtube.com/@IgrejaFoiPorAmorOficial/live',
  avisoHome:   'Reunião de Líderes na próxima segunda-feira às 19h30.',
  pixKey:      'igrejafoiporamor@exemplo.com.br',
  whatsapp: {
    geracaoFogo: '5511999999001',
    larDePaz:    '5511999999002',
  },
  cultos: [
    { id: 1, diaSemana: 2, hora: 19, min: 30, horaFim: 21, minFim: 0, nome: 'Curso de Teologia',              ativo: true,  restrito: false, foto: null },
    { id: 2, diaSemana: 4, hora: 19, min: 30, horaFim: 21, minFim: 0, nome: 'Culto de Oração e Adoração',     ativo: true,  restrito: false, foto: null },
    { id: 3, diaSemana: 5, hora: 19, min: 30, horaFim: 21, minFim: 0, nome: 'Ensaio do Ministério de Louvor', ativo: true,  restrito: true,  foto: null },
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
