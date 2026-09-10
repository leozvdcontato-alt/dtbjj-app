export const FAIXAS = [
  "Branca",
  "Cinza e Branca",
  "Cinza",
  "Cinza e Preta",
  "Amarela e Branca",
  "Amarela",
  "Amarela e Preta",
  "Laranja e Branca",
  "Laranja",
  "Laranja e Preta",
  "Verde e Branca",
  "Verde",
  "Verde e Preta",
  "Azul",
  "Roxa",
  "Marrom",
  "Preta",
];

const MAPA_FAIXAS = {
  Branca: "branca",
  "Cinza e Branca": "cinza_branca",
  Cinza: "cinza",
  "Cinza e Preta": "cinza_preta",
  "Amarela e Branca": "amarela_branca",
  Amarela: "amarela",
  "Amarela e Preta": "amarela_preta",
  "Laranja e Branca": "laranja_branca",
  Laranja: "laranja",
  "Laranja e Preta": "laranja_preta",
  "Verde e Branca": "verde_branca",
  Verde: "verde",
  "Verde e Preta": "verde_preta",
  Azul: "azul",
  Roxa: "roxa",
  Marrom: "marrom",
  Preta: "preta",
};

export function normalizarFaixa(faixa) {
  return MAPA_FAIXAS[faixa] || "branca";
}

export function rotuloGraus(graus) {
  const quantidade = Number(graus || 0);

  if (quantidade === 0) return "Sem grau";
  if (quantidade === 1) return "1 grau";
  return quantidade + " graus";
}
