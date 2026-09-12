const FUSO_APP = "America/Sao_Paulo";

function partesAgora() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: FUSO_APP,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  return Object.fromEntries(
    partes
      .filter((parte) => parte.type !== "literal")
      .map((parte) => [parte.type, parte.value])
  );
}

export function dataHojeApp() {
  const { year, month, day } = partesAgora();
  return `${year}-${month}-${day}`;
}

export function horaAgoraApp() {
  const { hour, minute } = partesAgora();
  return `${hour}:${minute}`;
}
