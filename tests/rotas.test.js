import test from "node:test";
import assert from "node:assert/strict";
import { paginaDaRota, rotaDaTela } from "../src/lib/rotas.js";

test("resolve rotas principais", () => {
  assert.equal(paginaDaRota("/chamada").pagina, "chamada");
  assert.equal(paginaDaRota("/turmas/5").pagina, "turma");
  assert.equal(paginaDaRota("/turmas/5").turmaId, 5);
});

test("gera rota de detalhe da turma", () => {
  assert.equal(
    rotaDaTela({ pagina: "turma", turma: { id: 7 } }),
    "/turmas/7"
  );
});
