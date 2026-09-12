export function validarSenha(senha = "") {
  return {
    tamanho: senha.length >= 8,
    letra: /[A-Za-zÀ-ÖØ-öø-ÿ]/.test(senha),
    numero: /\d/.test(senha),
  };
}

export function senhaValida(senha = "") {
  const regra = validarSenha(senha);
  return regra.tamanho && regra.letra && regra.numero;
}

export const TEXTO_REGRA_SENHA =
  "Use pelo menos 8 caracteres, com pelo menos 1 letra e 1 número.";
