const DIAS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function horaCurta(valor) {
  return String(valor || "").slice(0, 5);
}

export function agruparHorarios(horarios = []) {
  if (!horarios.length) return [];

  const porDia = new Map();

  for (const item of horarios) {
    const dia = Number(item.dia_semana);
    const hora = horaCurta(item.horario_inicio);

    if (!Number.isInteger(dia) || !hora) continue;

    const atuais = porDia.get(dia) || [];
    if (!atuais.includes(hora)) atuais.push(hora);
    porDia.set(dia, atuais.sort());
  }

  const grupos = new Map();

  for (const [dia, horas] of [...porDia.entries()].sort((a, b) => a[0] - b[0])) {
    const assinatura = horas.join("|");
    const atual = grupos.get(assinatura) || { dias: [], horarios: horas };
    atual.dias.push(dia);
    grupos.set(assinatura, atual);
  }

  return [...grupos.values()].map((grupo) => ({
    dias: grupo.dias,
    horarios: grupo.horarios,
    texto:
      grupo.dias.map((dia) => DIAS[dia]).join(" • ") +
      " · " +
      grupo.horarios.join(" / "),
  }));
}

export function agruparSlots(horarios = [], { separarProfessor = true } = {}) {
  const grupos = new Map();

  for (const item of horarios) {
    const hora = horaCurta(item.horario_inicio);
    const professor = item.professor || "";
    const assinatura = separarProfessor ? `${hora}|${professor}` : hora;
    const atual = grupos.get(assinatura) || {
      id: assinatura,
      horario: hora,
      professor,
      dias: [],
      horarioIds: [],
    };

    atual.dias.push(Number(item.dia_semana));
    atual.horarioIds.push(item.id);
    grupos.set(assinatura, atual);
  }

  return [...grupos.values()]
    .map((grupo) => ({
      ...grupo,
      dias: [...new Set(grupo.dias)].sort((a, b) => a - b),
      texto: `${[...new Set(grupo.dias)]
        .sort((a, b) => a - b)
        .map((dia) => DIAS[dia])
        .join(" • ")} · ${grupo.horario}`,
    }))
    .sort((a, b) => a.horario.localeCompare(b.horario));
}

export function resumoHorarios(horarios = []) {
  return agruparHorarios(horarios)
    .map((grupo) => grupo.texto)
    .join(" | ");
}
