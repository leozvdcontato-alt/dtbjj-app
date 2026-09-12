import test from "node:test";
import assert from "node:assert/strict";
import { agruparHorarios, agruparSlots } from "../src/lib/horarios.js";

test("agrupa dias com a mesma grade", () => {
  const horarios = [
    { id: 1, dia_semana: 1, horario_inicio: "20:00:00" },
    { id: 2, dia_semana: 3, horario_inicio: "20:00:00" },
  ];

  assert.deepEqual(
    agruparHorarios(horarios).map((item) => item.texto),
    ["Seg • Qua · 20:00"]
  );
});

test("separa slots quando o professor muda", () => {
  const horarios = [
    { id: 1, dia_semana: 1, horario_inicio: "19:00:00", professor: "Marcus" },
    { id: 2, dia_semana: 3, horario_inicio: "19:00:00", professor: "Marcus" },
    { id: 3, dia_semana: 5, horario_inicio: "19:00:00", professor: "Lucas" },
  ];

  const grupos = agruparSlots(horarios);
  assert.equal(grupos.length, 2);
  assert.equal(grupos[0].horario, "19:00");
});
