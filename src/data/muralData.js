import { saveMuralToSupabase } from './supabase';

const KEY = 'mural_data';

export const DEFAULT_MURAL = [];

export function loadMural() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved || !saved.length) return DEFAULT_MURAL;
    return saved;
  } catch { return DEFAULT_MURAL; }
}

export function saveMural(data) {
  localStorage.setItem(KEY, JSON.stringify(data));
  saveMuralToSupabase(data);
}
