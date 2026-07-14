// transfer.js — conversão do Transfer.py (mercado de transferências).
// Também define os times MÉDIOS e GRANDES (a temporada usa pra "força").

const TIMES_MEDIOS = [
  "Vasco do Gomes", "Corintianos", "São Paulino", "Gremista FC",
  "Realito Sociedade", "Atleti Madril", "Sevilhano",
  "Manchester Vermelho", "Newcastelo", "Astão Villa",
];
const TIMES_GRANDES = [
  "Flamável FC", "Fluminante", "Palmares SE",
  "Real Madril", "Barcelonense",
  "Manchester Azul", "Liverpudle",
];

// função pura: nível da proposta pelo desempenho
function nivelProposta(gols, defesas) {
  if (gols >= 40 || defesas >= 40) return "grande";
  if (gols >= 20 || defesas >= 20) return "medio";
  return null;
}

let _propostaTime = null;

function telaMercado() {
  const en = carregar("config") === "English";
  const meuTime = carregar("team");
  const s = carregarStats();
  const nivel = nivelProposta(s.Gols, s.Defesas);

  if (nivel === null) {
    tela.innerHTML = `
      <h2>${en ? "TRANSFER MARKET" : "MERCADO DE TRANSFERÊNCIAS"}</h2>
      <p>${en ? "No offers yet. Get 20 goals or 20 defenses in your career!" : "Nenhuma proposta ainda. Faça 20 gols ou 20 defesas na carreira!"}</p>
      <button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>
    `;
    return;
  }

  const opcoes = (nivel === "grande") ? TIMES_GRANDES : TIMES_MEDIOS;
  const candidatos = [];
  for (const t of opcoes) {
    if (t !== meuTime) candidatos.push(t);
  }
  _propostaTime = candidatos[Math.floor(Math.random() * candidatos.length)];

  const linha = (nivel === "grande")
    ? (en ? `WOW! A BIG club, ${_propostaTime}, wants you!` : `UAU! Um time GRANDE, o ${_propostaTime}, quer você!`)
    : (en ? `${_propostaTime} (average club) made an offer for you!` : `O ${_propostaTime} (time médio) fez uma proposta por você!`);

  tela.innerHTML = `
    <h2>${en ? "TRANSFER MARKET" : "MERCADO DE TRANSFERÊNCIAS"}</h2>
    <p class="importante">${linha}</p>
    <p>${en ? "Your current team" : "Seu time atual"}: ${meuTime}</p>
    <button onclick="aceitarTransfer()">${en ? "Accept" : "Aceitar"}</button>
    <button onclick="hub()">${en ? "Decline" : "Recusar"}</button>
  `;
}

function aceitarTransfer() {
  const en = carregar("config") === "English";
  salvar("team", _propostaTime);
  tela.innerHTML = `
    <p class="importante">${en ? `Transfer done! You now play for ${_propostaTime}.` : `Transferência feita! Agora você joga no ${_propostaTime}.`}</p>
    <button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>
  `;
}
