import { saveTeologiaToSupabase } from './supabase';

export const TEOLOGIA_KEY = 'iteap_config';

export const TEOLOGIA_DEFAULT = {
  professor:         'Pr. Luís Carlos Pedreira Marques',
  descricao:         'Instituto Teológico Amor e Palavra',
  moduloAtualIdx:    0,
  progressoAulas:    4,
  modulos: [
    { id: 1, nome: 'Pneumatologia', totalAulas: 12 },
    { id: 2, nome: 'Cristologia',   totalAulas: 10 },
    { id: 3, nome: 'Hermenêutica',  totalAulas: 8  },
    { id: 4, nome: 'Escatologia',   totalAulas: 14 },
    { id: 5, nome: 'Eclesiologia',  totalAulas: 9  },
  ],
};

export function loadTeologia() {
  try {
    const saved = JSON.parse(localStorage.getItem(TEOLOGIA_KEY));
    if (!saved) return TEOLOGIA_DEFAULT;
    return { ...TEOLOGIA_DEFAULT, ...saved, modulos: saved.modulos || TEOLOGIA_DEFAULT.modulos };
  } catch { return TEOLOGIA_DEFAULT; }
}

export function saveTeologia(data) {
  localStorage.setItem(TEOLOGIA_KEY, JSON.stringify(data));
  saveTeologiaToSupabase(data);
}

