// Metadados dos 66 livros (nome, slug e nº de capítulos) — dados estáticos,
// não mudam, então ficam embutidos no app em vez de buscados por rede.
// Fonte: API pública da Bíblia by Midvash (https://api.midvash.com), slugs em pt-br.
export const LIVROS = [
  { id: 1,  nome: 'Gênesis',            slug: 'genesis',             abrev: 'Gn',  capitulos: 50, testamento: 'old' },
  { id: 2,  nome: 'Êxodo',              slug: 'exodo',                abrev: 'Êx',  capitulos: 40, testamento: 'old' },
  { id: 3,  nome: 'Levítico',           slug: 'levitico',             abrev: 'Lv',  capitulos: 27, testamento: 'old' },
  { id: 4,  nome: 'Números',            slug: 'numeros',              abrev: 'Nm',  capitulos: 36, testamento: 'old' },
  { id: 5,  nome: 'Deuteronômio',       slug: 'deuteronomio',         abrev: 'Dt',  capitulos: 34, testamento: 'old' },
  { id: 6,  nome: 'Josué',              slug: 'josue',                abrev: 'Js',  capitulos: 24, testamento: 'old' },
  { id: 7,  nome: 'Juízes',             slug: 'juizes',               abrev: 'Jz',  capitulos: 21, testamento: 'old' },
  { id: 8,  nome: 'Rute',               slug: 'rute',                 abrev: 'Rt',  capitulos: 4,  testamento: 'old' },
  { id: 9,  nome: '1 Samuel',           slug: '1-samuel',             abrev: '1Sm', capitulos: 31, testamento: 'old' },
  { id: 10, nome: '2 Samuel',           slug: '2-samuel',             abrev: '2Sm', capitulos: 24, testamento: 'old' },
  { id: 11, nome: '1 Reis',             slug: '1-reis',               abrev: '1Rs', capitulos: 22, testamento: 'old' },
  { id: 12, nome: '2 Reis',             slug: '2-reis',               abrev: '2Rs', capitulos: 25, testamento: 'old' },
  { id: 13, nome: '1 Crônicas',         slug: '1-cronicas',           abrev: '1Cr', capitulos: 29, testamento: 'old' },
  { id: 14, nome: '2 Crônicas',         slug: '2-cronicas',           abrev: '2Cr', capitulos: 36, testamento: 'old' },
  { id: 15, nome: 'Esdras',             slug: 'esdras',               abrev: 'Ed',  capitulos: 10, testamento: 'old' },
  { id: 16, nome: 'Neemias',            slug: 'neemias',              abrev: 'Ne',  capitulos: 13, testamento: 'old' },
  { id: 17, nome: 'Ester',              slug: 'ester',                abrev: 'Et',  capitulos: 10, testamento: 'old' },
  { id: 18, nome: 'Jó',                 slug: 'jo',                   abrev: 'Jó',  capitulos: 42, testamento: 'old' },
  { id: 19, nome: 'Salmos',             slug: 'salmos',               abrev: 'Sl',  capitulos: 150, testamento: 'old' },
  { id: 20, nome: 'Provérbios',         slug: 'proverbios',           abrev: 'Pv',  capitulos: 31, testamento: 'old' },
  { id: 21, nome: 'Eclesiastes',        slug: 'eclesiastes',          abrev: 'Ec',  capitulos: 12, testamento: 'old' },
  { id: 22, nome: 'Cânticos',           slug: 'canticos',             abrev: 'Ct',  capitulos: 8,  testamento: 'old' },
  { id: 23, nome: 'Isaías',             slug: 'isaias',               abrev: 'Is',  capitulos: 66, testamento: 'old' },
  { id: 24, nome: 'Jeremias',           slug: 'jeremias',             abrev: 'Jr',  capitulos: 52, testamento: 'old' },
  { id: 25, nome: 'Lamentações',        slug: 'lamentacoes',          abrev: 'Lm',  capitulos: 5,  testamento: 'old' },
  { id: 26, nome: 'Ezequiel',           slug: 'ezequiel',             abrev: 'Ez',  capitulos: 48, testamento: 'old' },
  { id: 27, nome: 'Daniel',             slug: 'daniel',               abrev: 'Dn',  capitulos: 12, testamento: 'old' },
  { id: 28, nome: 'Oseias',             slug: 'oseias',               abrev: 'Os',  capitulos: 14, testamento: 'old' },
  { id: 29, nome: 'Joel',               slug: 'joel',                 abrev: 'Jl',  capitulos: 3,  testamento: 'old' },
  { id: 30, nome: 'Amós',               slug: 'amos',                 abrev: 'Am',  capitulos: 9,  testamento: 'old' },
  { id: 31, nome: 'Obadias',            slug: 'obadias',              abrev: 'Ob',  capitulos: 1,  testamento: 'old' },
  { id: 32, nome: 'Jonas',              slug: 'jonas',                abrev: 'Jn',  capitulos: 4,  testamento: 'old' },
  { id: 33, nome: 'Miqueias',           slug: 'miqueias',             abrev: 'Mq',  capitulos: 7,  testamento: 'old' },
  { id: 34, nome: 'Naum',               slug: 'naum',                 abrev: 'Na',  capitulos: 3,  testamento: 'old' },
  { id: 35, nome: 'Habacuque',          slug: 'habacuque',            abrev: 'Hc',  capitulos: 3,  testamento: 'old' },
  { id: 36, nome: 'Sofonias',           slug: 'sofonias',             abrev: 'Sf',  capitulos: 3,  testamento: 'old' },
  { id: 37, nome: 'Ageu',               slug: 'ageu',                 abrev: 'Ag',  capitulos: 2,  testamento: 'old' },
  { id: 38, nome: 'Zacarias',           slug: 'zacarias',             abrev: 'Zc',  capitulos: 14, testamento: 'old' },
  { id: 39, nome: 'Malaquias',          slug: 'malaquias',            abrev: 'Ml',  capitulos: 4,  testamento: 'old' },
  { id: 40, nome: 'Mateus',             slug: 'mateus',               abrev: 'Mt',  capitulos: 28, testamento: 'new' },
  { id: 41, nome: 'Marcos',             slug: 'marcos',               abrev: 'Mc',  capitulos: 16, testamento: 'new' },
  { id: 42, nome: 'Lucas',              slug: 'lucas',                abrev: 'Lc',  capitulos: 24, testamento: 'new' },
  { id: 43, nome: 'João',               slug: 'joao',                 abrev: 'Jo',  capitulos: 21, testamento: 'new' },
  { id: 44, nome: 'Atos',               slug: 'atos',                 abrev: 'At',  capitulos: 28, testamento: 'new' },
  { id: 45, nome: 'Romanos',            slug: 'romanos',              abrev: 'Rm',  capitulos: 16, testamento: 'new' },
  { id: 46, nome: '1 Coríntios',        slug: '1-corintios',          abrev: '1Co', capitulos: 16, testamento: 'new' },
  { id: 47, nome: '2 Coríntios',        slug: '2-corintios',          abrev: '2Co', capitulos: 13, testamento: 'new' },
  { id: 48, nome: 'Gálatas',            slug: 'galatas',              abrev: 'Gl',  capitulos: 6,  testamento: 'new' },
  { id: 49, nome: 'Efésios',            slug: 'efesios',              abrev: 'Ef',  capitulos: 6,  testamento: 'new' },
  { id: 50, nome: 'Filipenses',         slug: 'filipenses',           abrev: 'Fp',  capitulos: 4,  testamento: 'new' },
  { id: 51, nome: 'Colossenses',        slug: 'colossenses',          abrev: 'Cl',  capitulos: 4,  testamento: 'new' },
  { id: 52, nome: '1 Tessalonicenses',  slug: '1-tessalonicenses',    abrev: '1Ts', capitulos: 5,  testamento: 'new' },
  { id: 53, nome: '2 Tessalonicenses',  slug: '2-tessalonicenses',    abrev: '2Ts', capitulos: 3,  testamento: 'new' },
  { id: 54, nome: '1 Timóteo',          slug: '1-timoteo',            abrev: '1Tm', capitulos: 6,  testamento: 'new' },
  { id: 55, nome: '2 Timóteo',          slug: '2-timoteo',            abrev: '2Tm', capitulos: 4,  testamento: 'new' },
  { id: 56, nome: 'Tito',               slug: 'tito',                 abrev: 'Tt',  capitulos: 3,  testamento: 'new' },
  { id: 57, nome: 'Filemom',            slug: 'filemom',              abrev: 'Fm',  capitulos: 1,  testamento: 'new' },
  { id: 58, nome: 'Hebreus',            slug: 'hebreus',              abrev: 'Hb',  capitulos: 13, testamento: 'new' },
  { id: 59, nome: 'Tiago',              slug: 'tiago',                abrev: 'Tg',  capitulos: 5,  testamento: 'new' },
  { id: 60, nome: '1 Pedro',            slug: '1-pedro',              abrev: '1Pe', capitulos: 5,  testamento: 'new' },
  { id: 61, nome: '2 Pedro',            slug: '2-pedro',              abrev: '2Pe', capitulos: 3,  testamento: 'new' },
  { id: 62, nome: '1 João',             slug: '1-joao',               abrev: '1Jo', capitulos: 5,  testamento: 'new' },
  { id: 63, nome: '2 João',             slug: '2-joao',               abrev: '2Jo', capitulos: 1,  testamento: 'new' },
  { id: 64, nome: '3 João',             slug: '3-joao',               abrev: '3Jo', capitulos: 1,  testamento: 'new' },
  { id: 65, nome: 'Judas',              slug: 'judas',                abrev: 'Jd',  capitulos: 1,  testamento: 'new' },
  { id: 66, nome: 'Apocalipse',         slug: 'apocalipse',           abrev: 'Ap',  capitulos: 22, testamento: 'new' },
];

const API_BASE     = 'https://api.midvash.com/v1';
export const VERSAO = 'nvi'; // Nova Versão Internacional

// Busca um capítulo completo (todos os versículos) numa versão em português.
// Resposta: { version, book, bookName, chapter, verses: ['texto v1', 'texto v2', ...] }
export async function buscarCapitulo(livroSlug, capitulo) {
  const res = await fetch(`${API_BASE}/${VERSAO}/${livroSlug}/${capitulo}`);
  if (!res.ok) throw new Error('Não foi possível carregar esse capítulo agora.');
  const json = await res.json();
  return json.data;
}

const MARCACOES_KEY       = 'biblia_marcacoes';
const ULTIMA_LEITURA_KEY  = 'biblia_ultima_leitura';

export const CORES_MARCACAO = ['#fde047', '#86efac', '#93c5fd', '#f9a8d4'];

export function chaveVersiculo(livroSlug, capitulo, versiculo) {
  return `${livroSlug}:${capitulo}:${versiculo}`;
}

export function loadMarcacoes() {
  try { return JSON.parse(localStorage.getItem(MARCACOES_KEY)) || {}; }
  catch { return {}; }
}

export function salvarMarcacoes(marcacoes) {
  localStorage.setItem(MARCACOES_KEY, JSON.stringify(marcacoes));
}

export function loadUltimaLeitura() {
  try { return JSON.parse(localStorage.getItem(ULTIMA_LEITURA_KEY)); }
  catch { return null; }
}

export function salvarUltimaLeitura(livroSlug, capitulo) {
  localStorage.setItem(ULTIMA_LEITURA_KEY, JSON.stringify({ livroSlug, capitulo }));
}
