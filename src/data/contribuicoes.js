const KEY = 'contribuicoes';

export function loadContribuicoes() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; }
  catch { return []; }
}

export function saveContribuicao({ tipo, valorNum, valorFormatado }) {
  const lista = loadContribuicoes();
  lista.unshift({
    id: Date.now(),
    tipo,
    valorNum,
    valorFormatado,
    data: new Date().toLocaleDateString('pt-BR'),
  });
  localStorage.setItem(KEY, JSON.stringify(lista));
}

export function clearContribuicoes() {
  localStorage.setItem(KEY, JSON.stringify([]));
}

export function totalContribuicoes(lista) {
  return lista.reduce((sum, c) => sum + (c.valorNum || 0), 0);
}

export function totalPorObra(lista) {
  return lista.reduce((acc, c) => {
    acc[c.tipo] = (acc[c.tipo] || 0) + (c.valorNum || 0);
    return acc;
  }, {});
}
