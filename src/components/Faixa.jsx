const CORES = {
  branca: "#F5F5F5",
  cinza: "#9E9E9E",
  amarela: "#F2C94C",
  laranja: "#F2994A",
  verde: "#27AE60",
  azul: "#2F80ED",
  roxa: "#9B51E0",
  marrom: "#8B5A2B",
  preta: "#1C1C1C",
};

const MAPA = {
  branca: ["branca"],
  cinza_branca: ["cinza", "branca"],
  cinza: ["cinza"],
  cinza_preta: ["cinza", "preta"],

  amarela_branca: ["amarela", "branca"],
  amarela: ["amarela"],
  amarela_preta: ["amarela", "preta"],

  laranja_branca: ["laranja", "branca"],
  laranja: ["laranja"],
  laranja_preta: ["laranja", "preta"],

  verde_branca: ["verde", "branca"],
  verde: ["verde"],
  verde_preta: ["verde", "preta"],

  azul: ["azul"],
  roxa: ["roxa"],
  marrom: ["marrom"],
  preta: ["preta"],
};

export default function Faixa({
  faixa = "branca",
  graus = 0,
}) {

  const cores = MAPA[faixa] || ["branca"];

  return (
    <div className="flex flex-1 items-center">

{cores.map((cor, index) => (

  <div
    key={index}
    className={`
      h-2.5
      ${cores.length === 1 ? "w-14 rounded-full" : ""}
      ${cores.length === 2 && index === 0 ? "w-10 rounded-l-full" : ""}
      ${cores.length === 2 && index === 1 ? "w-4 rounded-r-full" : ""}
    `}
    style={{
      backgroundColor: CORES[cor],
    }}
  />

))}

<div className="flex items-center gap-[3px] ml-2">

  {Array.from({ length: graus }).map((_, index) => (

    <div
      key={index}
      className="w-[3px] h-3 bg-white rounded-full"
    />

  ))}

</div>
    </div>
  );

}