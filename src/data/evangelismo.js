export const EVANGELISMO_KEY = 'evangelismo_saidas';

export const SAIDAS_DEFAULT = [
  {
    id: 1,
    titulo: 'Saída ao Centro',
    data: '05/07/2026',
    diaSemana: 'Sábado',
    horario: '09:00',
    pontoEncontro: 'Frente da Igreja',
    local: 'Centro da Cidade',
    lider: 'Pr. Daniel',
    descricao: 'Distribuição de folhetos e abordagem evangelística nas ruas do centro. Traga sua Bíblia e disposição para servir.',
    vagas: 20,
  },
  {
    id: 2,
    titulo: 'Visitação em Bairros',
    data: '12/07/2026',
    diaSemana: 'Sábado',
    horario: '14:00',
    pontoEncontro: 'Estacionamento da Igreja',
    local: 'Bairro Nova Esperança',
    lider: 'Ev. Marcos',
    descricao: 'Visitas casa a casa para apresentar o evangelho e convidar moradores para os cultos. Equipes de 3 pessoas.',
    vagas: 15,
  },
  {
    id: 3,
    titulo: 'Culto ao Ar Livre',
    data: '19/07/2026',
    diaSemana: 'Sábado',
    horario: '16:00',
    pontoEncontro: 'Praça Central',
    local: 'Praça Central',
    lider: 'Pr. Josué',
    descricao: 'Culto evangelístico aberto ao público com louvor, palavra e testemunhos. Precisamos de voluntários para som, logística e equipe de oração.',
    vagas: 30,
  },
  {
    id: 4,
    titulo: 'Evangelismo Universitário',
    data: '26/07/2026',
    diaSemana: 'Sábado',
    horario: '10:00',
    pontoEncontro: 'Portão Principal da Universidade',
    local: 'Campus Universitário',
    lider: 'Diác. Rafaela',
    descricao: 'Alcançando estudantes com o evangelho através de conversas, materiais e convites para grupos de estudo bíblico.',
    vagas: 12,
  },
];

export function loadSaidas() {
  try {
    const salvas = JSON.parse(localStorage.getItem(EVANGELISMO_KEY));
    return salvas || SAIDAS_DEFAULT;
  } catch { return SAIDAS_DEFAULT; }
}

export function saveSaidas(saidas) {
  localStorage.setItem(EVANGELISMO_KEY, JSON.stringify(saidas));
}
