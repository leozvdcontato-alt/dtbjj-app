const ROTULOS = {
  aluno: "Aluno",
  professor: "Professor",
  administrador: "Administrador",
};

export function normalizarCargo(cargo = "") {
  const valor = cargo.trim().toLowerCase();

  if (valor.startsWith("administrador")) return "administrador";
  if (valor.startsWith("professor")) return "professor";
  return "aluno";
}

export function rotuloCargo(cargo) {
  return ROTULOS[normalizarCargo(cargo)];
}

export function ehAluno(usuario) {
  return normalizarCargo(usuario?.cargo) === "aluno";
}

export function podeGerenciarAcademia(usuario) {
  return ["professor", "administrador"].includes(
    normalizarCargo(usuario?.cargo)
  );
}

export function ehAdministrador(usuario) {
  return normalizarCargo(usuario?.cargo) === "administrador";
}
