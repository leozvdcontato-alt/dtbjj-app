import test from "node:test";
import assert from "node:assert/strict";
import {
  ehAdministrador,
  ehAluno,
  normalizarCargo,
  podeGerenciarAcademia,
} from "../src/lib/permissoes.js";

test("normaliza papéis do app", () => {
  assert.equal(normalizarCargo("Administrador DTBJJ"), "administrador");
  assert.equal(normalizarCargo("Professor"), "professor");
  assert.equal(normalizarCargo("Aluno"), "aluno");
});

test("aplica capacidades por papel", () => {
  assert.equal(ehAdministrador({ cargo: "Administrador" }), true);
  assert.equal(podeGerenciarAcademia({ cargo: "Professor" }), true);
  assert.equal(ehAluno({ cargo: "Aluno" }), true);
});
