// transfer.js — conversão do Transfer.py (mercado de transferências).
// Também define os times MÉDIOS e GRANDES (a temporada usa pra "força").
//
// FORÇA DO TIME (quantos lances/chances de gol o time cria por partida):
//   GRANDE = 12 lances  |  MÉDIO = 8 lances  |  PEQUENO = 5 lances (padrão)
// Quem NÃO está em nenhuma lista abaixo é pequeno (5). Ex: Coritiba, Vasco da Gama, Leicester.

const TIMES_MEDIOS = [
  // Brasileirão
  "São Paulo", "Gremio", "Santos", "Cruzeiro", "Internacional",
  "Botafogo", "Fortaleza", "Atlético Paranaense", "RB Bragantino",
  // La Liga
  "Villarreal", "Sevilha", "Betis", "Real Sociedad", "Celta de Vigo", "Athletic Bilbau",
  // Premier League
  "Totenham Spurs", "Newcastle", "Aston Villa", "Brighton", "WestRam", "Everton",
];
const TIMES_GRANDES = [
  // Brasileirão
  "Flamengo", "Palmeiras", "Corinthians", "Fluminense", "Atlético Mineiro",
  // La Liga
  "Real Madrid", "Barcelona", "Atletico de Madrid",
  // Premier League
  "Manchester City", "Manchester United", "Liverpool", "Chelsea", "Arsenal",
];

// função pura: nível da proposta pelo desempenho
function nivelProposta(gols, defesas, assist) {
  const m = Math.max(gols || 0, defesas || 0, assist || 0); // gols, defesas OU assistências
  if (m >= 40) return "grande";
  if (m >= 20) return "medio";
  return null;
}

let _propostaTime = null;

function telaMercado() {
  const en = carregar("config") === "English";
  const meuTime = carregar("team");
  const s = carregarStats();
  const nivel = nivelProposta(s.Gols, s.Defesas, s.Assistencias);

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
