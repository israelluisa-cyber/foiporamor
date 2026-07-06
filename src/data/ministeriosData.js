import { saveMinisteriosToSupabase } from './supabase';

const KEY = 'ministerios_data';

export const DEFAULT_MINISTERIOS = [
  {
    id: 'louvor',
    nome: 'Louvor e Adoração',
    descricao: 'Conduz a congregação à presença de Deus através do louvor e da adoração nos cultos.',
    sobreNos: {
      resumo: 'Somos o ministério que conduz a Igreja Foi Por Amor à presença de Deus através da música e da adoração. Nossos integrantes são comprometidos com a excelência musical e com a unção espiritual em cada culto.',
      atividades: [
        'Ministração nos cultos de domingo, terça e quinta',
        'Ensaios regulares às sextas-feiras',
        'Encontros de formação espiritual e musical',
        'Preparação de repertórios para datas especiais',
      ],
      visao: 'Criar momentos de genuína adoração onde a congregação encontra a Deus e é transformada pela Sua presença.',
    },
    lideres: [],
    icon: 'ph-music-notes',
    membros: 18,
    tag: 'Música',
    gradient: 'linear-gradient(135deg, #0f766e 0%, #059669 100%)',
    glow: 'rgba(16,185,129,0.4)',
    ring: 'rgba(52,211,153,0.45)',
    foto: null,
    ativo: true,
  },
  {
    id: 'evangelismo',
    nome: 'Evangelismo FPA',
    descricao: 'Equipe que leva o evangelho às ruas, praças e comunidades ao redor da igreja.',
    sobreNos: {
      resumo: 'Somos uma equipe missionária que cumpre o grande mandato de Jesus: ir! Levamos o evangelho às ruas, mas também cuidamos das necessidades das pessoas — com alimentos, visitas a hospitais, apoio a casas de recuperação e parceria com instituições sociais.',
      atividades: [
        'Saídas de evangelismo nas ruas e praças da cidade',
        'Distribuição de alimentos para pessoas em situação de vulnerabilidade',
        'Visitas e cultos em hospitais e casas de recuperação',
        'Apoio e parceria com instituições beneficentes',
        'Internações e acompanhamento em instituições de apoio',
      ],
      visao: 'Ser as mãos e os pés de Jesus, levando esperança onde a dor é maior e o amor de Deus ainda precisa chegar.',
    },
    lideres: [],
    icon: 'ph-megaphone',
    membros: 12,
    tag: 'Missões',
    gradient: 'linear-gradient(135deg, #c2410c 0%, #f59e0b 100%)',
    glow: 'rgba(234,88,12,0.4)',
    ring: 'rgba(251,146,60,0.45)',
    foto: null,
    ativo: true,
  },
  {
    id: 'obreiros',
    nome: 'Ministério de Obreiros',
    descricao: 'Diáconos e diaconisas que servem com dedicação e excelência na casa de Deus.',
    sobreNos: {
      resumo: 'O Ministério de Obreiros é formado por diáconos e diaconisas que servem nos bastidores da casa de Deus. Cada detalhe do culto passa pelas mãos deles — do preparo do templo ao recebimento das ofertas. Servir é a nossa vocação.',
      atividades: [
        'Organização e preparação do templo antes dos cultos',
        'Recebimento de ofertas e dízimos com excelência',
        'Suporte logístico em eventos e cultos especiais',
        'Apoio pastoral e assistencial sob supervisão da liderança',
      ],
      visao: 'Servir com coração de servo, tornando a casa de Deus um lugar de ordem, acolhimento e paz.',
    },
    lideres: [],
    icon: 'ph-shield-star',
    membros: 15,
    tag: 'Serviço',
    gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 100%)',
    glow: 'rgba(180,83,9,0.4)',
    ring: 'rgba(251,191,36,0.45)',
    foto: null,
    ativo: true,
  },
  {
    id: 'anas',
    nome: 'Anas — Ministério de Mulheres',
    descricao: 'Espaço de comunhão, fé e fortalecimento da identidade das mulheres da FPA.',
    sobreNos: {
      resumo: 'O Ministério Anas é o espaço das mulheres da Igreja Foi Por Amor. Celebramos a força, a fé e a beleza da mulher no propósito de Deus, através de encontros, estudos bíblicos, retiros e um laço de irmandade que fortalece cada uma.',
      atividades: [
        'Encontros mensais de comunhão e estudo da Palavra',
        'Retiros espirituais femininos anuais',
        'Visitas e suporte a mulheres em situação de vulnerabilidade',
        'Celebrações especiais: Dia das Mães, Páscoa e Natal',
      ],
      visao: 'Fortalecer a identidade da mulher em Cristo e promover laços de irmandade duradouros que transformam vidas.',
    },
    lideres: [],
    icon: 'ph-flower-lotus',
    membros: 24,
    tag: 'Mulheres',
    gradient: 'linear-gradient(135deg, #9d174d 0%, #ec4899 100%)',
    glow: 'rgba(157,23,77,0.4)',
    ring: 'rgba(244,114,182,0.45)',
    foto: null,
    ativo: true,
  },
  {
    id: 'kids',
    nome: 'Ministério Kids',
    descricao: 'Cuida e ensina as crianças com amor, criatividade e a Palavra de Deus.',
    sobreNos: {
      resumo: 'O Ministério Kids cuida e ensina as crianças de 0 a 12 anos da Igreja Foi Por Amor. Acreditamos que crianças podem ter uma fé genuína — e cabe a nós plantar essa semente com amor, criatividade e a Palavra de Deus desde cedo.',
      atividades: [
        'Escola dominical durante o culto de domingo',
        'Atividades lúdicas e pedagógicas com base bíblica',
        'Eventos especiais no Dia das Crianças, Páscoa e Natal',
        'Treinamento regular dos professores voluntários',
      ],
      visao: 'Plantar a Palavra de Deus no coração das crianças para que produzam frutos que permaneçam por toda a vida.',
    },
    lideres: [],
    icon: 'ph-star',
    membros: 20,
    tag: 'Infantil',
    gradient: 'linear-gradient(135deg, #b45309 0%, #fbbf24 100%)',
    glow: 'rgba(180,83,9,0.4)',
    ring: 'rgba(252,211,77,0.45)',
    foto: null,
    ativo: true,
  },
  {
    id: 'musicos',
    nome: 'Músicos e Adoração',
    descricao: 'Instrumentistas que ministram nos cultos com excelência, unção e comprometimento.',
    sobreNos: {
      resumo: 'Somos os instrumentistas que sustentam o ministério de louvor da Igreja Foi Por Amor. Nosso compromisso é com a excelência técnica e com a unção espiritual — porque oferecemos ao Senhor o melhor que temos.',
      atividades: [
        'Ministração de instrumentos em todos os cultos',
        'Ensaios semanais às sextas-feiras',
        'Aperfeiçoamento técnico e espiritual contínuo',
        'Produção de arranjos e adaptações para os repertórios',
      ],
      visao: 'Honrar ao Senhor com cada nota tocada, oferecendo excelência que glorifica e unção que transforma.',
    },
    lideres: [],
    icon: 'ph-guitar',
    membros: 10,
    tag: 'Música',
    gradient: 'linear-gradient(135deg, #312e81 0%, #6366f1 100%)',
    glow: 'rgba(99,102,241,0.4)',
    ring: 'rgba(129,140,248,0.45)',
    foto: null,
    ativo: true,
  },
  {
    id: 'midia',
    nome: 'Mídia FPA',
    descricao: 'Transmissão ao vivo, redes sociais, fotografia e design da Igreja Foi Por Amor.',
    sobreNos: {
      resumo: 'Somos a equipe responsável por levar a Igreja Foi Por Amor além dos muros do templo. Através de transmissões ao vivo, redes sociais, design e fotografia, conectamos pessoas ao evangelho e mantemos a comunidade unida.',
      atividades: [
        'Transmissão ao vivo dos cultos no YouTube',
        'Gestão das redes sociais (Instagram, Facebook, WhatsApp)',
        'Criação de artes, vídeos e conteúdo digital',
        'Fotografia e cobertura de cultos e eventos especiais',
      ],
      visao: 'Usar a tecnologia como ferramenta poderosa para alcançar almas e fortalecer a comunidade da FPA.',
    },
    lideres: [],
    icon: 'ph-broadcast',
    membros: 8,
    tag: 'Comunicação',
    gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    glow: 'rgba(30,64,175,0.4)',
    ring: 'rgba(96,165,250,0.45)',
    foto: null,
    ativo: true,
  },
  {
    id: 'iteap',
    nome: 'ITEAP',
    descricao: 'Instituto Teológico Amor e Palavra — formação bíblica e ministerial para líderes.',
    sobreNos: {
      resumo: 'O Instituto Teológico Amor e Palavra é a escola de formação ministerial da FPA. Oferecemos uma base sólida em Teologia Bíblica, Prática Pastoral e Liderança Cristã para equipar servos de Deus com sabedoria e profundidade.',
      atividades: [
        'Aulas presenciais às terças-feiras durante o ano letivo',
        'Disciplinas de Teologia Sistemática, Hermenêutica e Homilética',
        'Acompanhamento pastoral individual dos alunos',
        'Formatura anual dos novos teólogos formados',
      ],
      visao: 'Equipar homens e mulheres com a Palavra de Deus para que sirvam com sabedoria, excelência e amor.',
    },
    lideres: [],
    icon: 'ph-graduation-cap',
    membros: 32,
    tag: 'Teologia',
    gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
    glow: 'rgba(76,29,149,0.4)',
    ring: 'rgba(139,92,246,0.45)',
    foto: null,
    ativo: true,
  },
  {
    id: 'bemvindo',
    nome: 'Ministério Bem-vindo',
    descricao: 'Acolhe e integra visitantes e novos membros com carinho e hospitalidade cristã.',
    sobreNos: {
      resumo: 'O Ministério Bem-vindo é o rosto da Igreja Foi Por Amor. Somos os primeiros a receber cada pessoa que entra pela nossa porta — com um sorriso, um abraço e um coração aberto. Ninguém passa pela FPA sem se sentir em casa.',
      atividades: [
        'Recepção calorosa de visitantes nos cultos de domingo',
        'Acolhimento e integração de novos membros',
        'Cadastro e acompanhamento de visitantes pela liderança',
        'Preparação de materiais e kits de boas-vindas',
      ],
      visao: 'Que nenhuma pessoa saia da Igreja Foi Por Amor sem se sentir genuinamente amada, acolhida e bem-vinda.',
    },
    lideres: [],
    icon: 'ph-hand-waving',
    membros: 9,
    tag: 'Acolhimento',
    gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
    glow: 'rgba(6,95,70,0.4)',
    ring: 'rgba(52,211,153,0.45)',
    foto: null,
    ativo: true,
  },
  {
    id: 'jovens',
    nome: 'Ministério de Jovens',
    descricao: 'Jovens unidos para crescer na fé, na amizade e no propósito de Deus.',
    sobreNos: {
      resumo: 'O Ministério de Jovens da FPA é um espaço de identidade, fé e propósito para adolescentes e jovens adultos. Aqui, juventude e espiritualidade andam juntas — porque ser jovem e seguir a Jesus não é contradição, é a melhor combinação.',
      atividades: [
        'Encontros e cultos voltados para a juventude',
        'Eventos de integração, esportes e lazer com propósito',
        'Grupos de mentoria e discipulado para jovens',
        'Participação em saídas de evangelismo e missões',
      ],
      visao: 'Levantar uma geração de jovens que conhece a Deus, vive com propósito e impacta o mundo ao seu redor.',
    },
    lideres: [],
    icon: 'ph-lightning',
    membros: 28,
    tag: 'Juventude',
    gradient: 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)',
    glow: 'rgba(14,165,233,0.4)',
    ring: 'rgba(56,189,248,0.45)',
    foto: null,
    ativo: true,
  },
];

export function loadMinisterios() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved || !saved.length) return DEFAULT_MINISTERIOS;
    // merge: garante que novos campos do default apareçam em itens antigos
    return saved.map(s => {
      const def = DEFAULT_MINISTERIOS.find(d => d.id === s.id);
      return def ? { ...def, ...s } : s;
    });
  } catch { return DEFAULT_MINISTERIOS; }
}

export function saveMinisterios(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  saveMinisteriosToSupabase(data);
}

export const ICON_OPTIONS = [
  { value: 'ph-music-notes',     label: 'Música' },
  { value: 'ph-megaphone',       label: 'Megafone' },
  { value: 'ph-shield-star',     label: 'Escudo' },
  { value: 'ph-flower-lotus',    label: 'Flor' },
  { value: 'ph-star',            label: 'Estrela' },
  { value: 'ph-guitar',          label: 'Violão' },
  { value: 'ph-broadcast',       label: 'Transmissão' },
  { value: 'ph-graduation-cap',  label: 'Formatura' },
  { value: 'ph-hand-waving',     label: 'Aceno' },
  { value: 'ph-lightning',       label: 'Raio' },
  { value: 'ph-church',          label: 'Igreja' },
  { value: 'ph-users-three',     label: 'Grupo' },
  { value: 'ph-hands-praying',   label: 'Oração' },
  { value: 'ph-baby',            label: 'Bebê' },
  { value: 'ph-book-open',       label: 'Livro' },
  { value: 'ph-heart',           label: 'Coração' },
  { value: 'ph-cross',           label: 'Cruz' },
  { value: 'ph-dove',            label: 'Pomba' },
];

export const COLOR_PRESETS = [
  { label: 'Verde', gradient: 'linear-gradient(135deg, #0f766e 0%, #059669 100%)', glow: 'rgba(16,185,129,0.4)', ring: 'rgba(52,211,153,0.45)' },
  { label: 'Laranja', gradient: 'linear-gradient(135deg, #c2410c 0%, #f59e0b 100%)', glow: 'rgba(234,88,12,0.4)', ring: 'rgba(251,146,60,0.45)' },
  { label: 'Âmbar', gradient: 'linear-gradient(135deg, #92400e 0%, #d97706 100%)', glow: 'rgba(180,83,9,0.4)', ring: 'rgba(251,191,36,0.45)' },
  { label: 'Rosa', gradient: 'linear-gradient(135deg, #9d174d 0%, #ec4899 100%)', glow: 'rgba(157,23,77,0.4)', ring: 'rgba(244,114,182,0.45)' },
  { label: 'Amarelo', gradient: 'linear-gradient(135deg, #b45309 0%, #fbbf24 100%)', glow: 'rgba(180,83,9,0.4)', ring: 'rgba(252,211,77,0.45)' },
  { label: 'Índigo', gradient: 'linear-gradient(135deg, #312e81 0%, #6366f1 100%)', glow: 'rgba(99,102,241,0.4)', ring: 'rgba(129,140,248,0.45)' },
  { label: 'Azul', gradient: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', glow: 'rgba(30,64,175,0.4)', ring: 'rgba(96,165,250,0.45)' },
  { label: 'Roxo', gradient: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)', glow: 'rgba(76,29,149,0.4)', ring: 'rgba(139,92,246,0.45)' },
  { label: 'Esmeralda', gradient: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)', glow: 'rgba(6,95,70,0.4)', ring: 'rgba(52,211,153,0.45)' },
  { label: 'Céu', gradient: 'linear-gradient(135deg, #1e3a5f 0%, #0ea5e9 100%)', glow: 'rgba(14,165,233,0.4)', ring: 'rgba(56,189,248,0.45)' },
];
