// selecao.js — Seleção Nacional e Copa do Mundo.
// Fase 1: nacionalidade na ficha + convocação (por tamanho do clube) + tela de status.

// As 48 seleções. As 6 primeiras se classificam DIRETO pra Copa; as outras 42 vão pro sorteio.
const SELECOES_DIRETO = ["Brazil", "Spain", "Argentina", "France", "Germany", "England"];
const SELECOES_SORTEIO = [
  "Portugal", "Netherlands", "Belgium", "Italy", "Croatia", "Uruguay",
  "Colombia", "Mexico", "USA", "Japan", "South Korea", "Morocco",
  "Senegal", "Nigeria", "Ghana", "Cameroon", "Ecuador", "Peru",
  "Chile", "Paraguay", "Switzerland", "Denmark", "Poland", "Sweden",
  "Serbia", "Wales", "Scotland", "Austria", "Turkey", "Ukraine",
  "Czechia", "Norway", "Australia", "Saudi Arabia", "Iran", "Egypt",
  "Tunisia", "Algeria", "Costa Rica", "Ivory Coast", "Qatar", "Canada",
];
const SELECOES = SELECOES_DIRETO.concat(SELECOES_SORTEIO); // 48 no total

const COPA_INTERVALO = 4; // Copa do Mundo a cada 4 temporadas

// ===== FORÇA DAS SELEÇÕES (chances de gol por partida na Copa) =====
const CHANCES_SELECAO = { pequeno: 5, medio: 8, grande: 12, enorme: 16, campeao: 20 };

// Tier base de cada seleção (o "Campeão Atual" é dinâmico, ver campeaoAtual())
const TIER_SELECAO = {
  // ENORME
  "Brazil": "enorme", "Spain": "enorme", "Argentina": "enorme", "France": "enorme",
  "Germany": "enorme", "England": "enorme", "Portugal": "enorme",
  // GRANDE
  "Netherlands": "grande", "Belgium": "grande", "Italy": "grande", "Croatia": "grande",
  "Uruguay": "grande", "Colombia": "grande", "Morocco": "grande", "Switzerland": "grande", "Denmark": "grande",
  // MÉDIO
  "Mexico": "medio", "USA": "medio", "Japan": "medio", "South Korea": "medio", "Senegal": "medio",
  "Nigeria": "medio", "Ghana": "medio", "Cameroon": "medio", "Ecuador": "medio", "Peru": "medio",
  "Chile": "medio", "Paraguay": "medio", "Poland": "medio", "Sweden": "medio", "Serbia": "medio",
  "Wales": "medio", "Austria": "medio", "Turkey": "medio", "Ukraine": "medio", "Czechia": "medio",
  "Egypt": "medio", "Algeria": "medio", "Ivory Coast": "medio",
  // PEQUENO
  "Scotland": "pequeno", "Norway": "pequeno", "Australia": "pequeno", "Saudi Arabia": "pequeno",
  "Iran": "pequeno", "Tunisia": "pequeno", "Costa Rica": "pequeno", "Qatar": "pequeno", "Canada": "pequeno",
};

// Campeã atual (começa com a Espanha, campeã da Copa 2026; vira a vencedora da última Copa que você jogou)
function campeaoAtual() {
  return carregar("campeaoAtual") || "Spain";
}

// Força (chances) de uma seleção — a campeã atual é a mais forte de todas
function forcaSelecao(nation) {
  if (nation === campeaoAtual()) return CHANCES_SELECAO.campeao;
  return CHANCES_SELECAO[TIER_SELECAO[nation] || "pequeno"];
}

// Simula uma partida entre seleções (usa a força de cada uma)
function simularPartidaSelecao(a, b) {
  return [golsDe(forcaSelecao(a)), golsDe(forcaSelecao(b))];
}

// Temporada atual (contador simples; começa em 1)
function temporadaAtual() {
  return parseInt(carregar("temporada")) || 1;
}

// Nível do clube (reusa as listas do transfer.js)
function nivelClube(time) {
  if (typeof TIMES_GRANDES !== "undefined" && TIMES_GRANDES.includes(time)) return "grande";
  if (typeof TIMES_MEDIOS !== "undefined" && TIMES_MEDIOS.includes(time)) return "medio";
  return "pequeno";
}

// Requisito de convocação conforme o clube (0 = convocação direta)
function requisitoConvocacao(nivel) {
  if (nivel === "grande") return 0; // clube grande: direto
  if (nivel === "medio") return 30;
  return 20;                        // pequeno
}

// Está convocado? Clube grande vai direto; senão precisa de X gols OU X defesas na carreira.
function estaConvocado() {
  const req = requisitoConvocacao(nivelClube(carregar("team")));
  if (req === 0) return true;
  const s = carregarStats();
  return Math.max(s.Gols || 0, s.Defesas || 0, s.Assistencias || 0) >= req;
}

// Próxima temporada de Copa (o próximo múltiplo de COPA_INTERVALO)
function proximaCopa() {
  return Math.ceil(temporadaAtual() / COPA_INTERVALO) * COPA_INTERVALO;
}

function ehAnoDeCopa() {
  return temporadaAtual() % COPA_INTERVALO === 0;
}

// Tela da Seleção Nacional (status de convocação + próxima Copa)
function telaSelecao() {
  const en = carregar("config") === "English";
  const p = carregarObjeto("player") || {};
  const nac = p.nacionalidade || "?";
  const req = requisitoConvocacao(nivelClube(carregar("team")));
  const convocado = estaConvocado();
  const s = carregarStats();
  const marca = Math.max(s.Gols || 0, s.Defesas || 0, s.Assistencias || 0);
  const t = temporadaAtual();
  const prox = proximaCopa();

  let statusHtml;
  if (convocado) {
    statusHtml = `<p class="importante">${en ? "CALLED UP! You're on the national team! ✅" : "CONVOCADO! Você está na seleção! ✅"}</p>`;
  } else {
    statusHtml = `<p>${en
      ? `Not called up yet. Get ${req} goals OR ${req} saves in your career (you have ${marca}).`
      : `Ainda não convocado. Faça ${req} gols OU ${req} defesas na carreira (você tem ${marca}).`}</p>`;
  }

  let copaHtml;
  if (ehAnoDeCopa() && convocado) {
    copaHtml = `<p class="importante">${en ? "IT'S WORLD CUP YEAR — and you're in!" : "É ANO DE COPA DO MUNDO — e você está dentro!"}</p>
      <button onclick="telaCopa()">${en ? "Play the World Cup" : "Jogar a Copa do Mundo"}</button>`;
  } else if (ehAnoDeCopa() && !convocado) {
    copaHtml = `<p>${en ? "It's World Cup year, but you weren't called up. Keep working!" : "É ano de Copa, mas você não foi convocado. Continue trabalhando!"}</p>`;
  } else {
    copaHtml = `<p>${en ? `Next World Cup: season ${prox} (in ${prox - t} season(s)).` : `Próxima Copa do Mundo: temporada ${prox} (em ${prox - t} temporada(s)).`}</p>`;
  }

  tela.innerHTML = `
    <h2>${en ? "NATIONAL TEAM" : "SELEÇÃO NACIONAL"} 🌍</h2>
    <p>${en ? "Your nationality" : "Sua nacionalidade"}: <b>${nac}</b></p>
    ${statusHtml}
    <p>${en ? "Current season" : "Temporada atual"}: ${t}</p>
    ${copaHtml}
    <button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>
  `;
}

// ===== SORTEIO DA COPA (roleta) =====
// As 6 diretas + 26 sorteadas das 42 (cada uma tem um número 1-42; gira até completar 32).
function sortearCopa() {
  const classificadas = SELECOES_DIRETO.slice();
  const sorteios = [];
  while (classificadas.length < 32) {
    const num = Math.floor(Math.random() * SELECOES_SORTEIO.length) + 1; // 1..42
    const sel = SELECOES_SORTEIO[num - 1];
    if (classificadas.indexOf(sel) >= 0) continue; // já classificada -> gira de novo
    classificadas.push(sel);
    sorteios.push({ num: num, sel: sel });
  }
  return { classificadas: classificadas, sorteios: sorteios };
}

// Tela do sorteio. Guarda o resultado por temporada (não dá pra "re-rolar").
function telaCopa() {
  const en = carregar("config") === "English";
  const nac = (carregarObjeto("player") || {}).nacionalidade || "?";
  const t = temporadaAtual();

  let draw = carregarObjeto("copaDraw");
  if (!draw || draw.temporada !== t) {
    draw = sortearCopa();
    draw.temporada = t;
    salvarObjeto("copaDraw", draw);
  }
  const classificou = draw.classificadas.indexOf(nac) >= 0;

  let reveal = "";
  for (const s of draw.sorteios) {
    reveal += `<p>🎡 ${en ? "Wheel" : "Roleta"}: ${s.num} → <b>${s.sel}</b> ${en ? "qualified!" : "classificada!"}</p>`;
  }

  let acao;
  if (classificou) {
    acao = `<p class="importante">${en ? `${nac} QUALIFIED! Time to shine.` : `${nac} SE CLASSIFICOU! Hora de brilhar.`}</p>
      <button onclick="iniciarKnockout()">${en ? "Start the knockout!" : "Começar o mata-mata!"}</button>`;
  } else {
    acao = `<p class="importante">${en ? `${nac} didn't qualify this time. Better luck in 4 seasons!` : `${nac} não se classificou dessa vez. Mais sorte daqui a 4 temporadas!`}</p>
      <button onclick="telaSelecao()">${en ? "Back" : "Voltar"}</button>`;
  }

  tela.innerHTML = `
    <h2>${en ? "WORLD CUP — DRAW" : "COPA DO MUNDO — SORTEIO"} 🎡</h2>
    <p>${en ? "Current champion" : "Campeã atual"}: <b>${campeaoAtual()}</b> 👑</p>
    <p>${en ? "Qualified directly" : "Classificadas direto"}: ${SELECOES_DIRETO.join(", ")}</p>
    <p>${en ? "The wheel decides the other 26..." : "A roleta decide as outras 26..."}</p>
    <div style="max-height:180px; overflow:auto; border:1px solid #333; padding:4px;">${reveal}</div>
    ${acao}
  `;
}

// ===== MATA-MATA (jogável) =====
function faseNomeCopa(n, en) {
  if (n >= 32) return en ? "Round of 32" : "32-avos";
  if (n >= 16) return en ? "Round of 16" : "Oitavas de final";
  if (n >= 8) return en ? "Quarterfinals" : "Quartas de final";
  if (n >= 4) return en ? "Semifinals" : "Semifinais";
  return "FINAL";
}

function iniciarKnockout() {
  const draw = carregarObjeto("copaDraw");
  const nac = (carregarObjeto("player") || {}).nacionalidade;
  salvarObjeto("copa", { vivos: embaralhar(draw.classificadas), meuTime: nac });
  telaCopaRodada();
}

// Chaveamento da rodada atual (destaca sua partida)
function chaveamentoHTML(copa) {
  let linhas = "";
  for (let i = 0; i < copa.vivos.length; i += 2) {
    const a = copa.vivos[i], b = copa.vivos[i + 1];
    const eu = (a === copa.meuTime || b === copa.meuTime) ? "  <==" : "";
    linhas += `${a.padEnd(16)} x  ${(b || "?").padEnd(16)}${eu}\n`;
  }
  return `<pre>${linhas}</pre>`;
}

function adversarioCopa(copa) {
  const idx = copa.vivos.indexOf(copa.meuTime);
  const parIdx = (idx % 2 === 0) ? idx + 1 : idx - 1;
  return copa.vivos[parIdx];
}

function telaCopaRodada() {
  const en = carregar("config") === "English";
  const copa = carregarObjeto("copa");
  if (!copa) return telaSelecao();
  if (copa.vivos.length === 1) return telaCopaCampeao();
  const adversario = adversarioCopa(copa);

  tela.innerHTML = `
    <h2>${en ? "WORLD CUP" : "COPA DO MUNDO"} 🏆 — ${faseNomeCopa(copa.vivos.length, en)}</h2>
    <p>${copa.vivos.length} ${en ? "teams left" : "seleções na disputa"}</p>
    ${chaveamentoHTML(copa)}
    <p class="importante">${en ? "Your match" : "Sua partida"}: ${copa.meuTime} vs ${adversario}</p>
    <button onclick="jogarPartidaCopa('jogar')">${en ? "Play my match" : "Jogar minha partida"}</button>
    <button onclick="jogarPartidaCopa('simular')">${en ? "Simulate" : "Simular"}</button>
  `;
}

function jogarPartidaCopa(modo) {
  const copa = carregarObjeto("copa");
  const adversario = adversarioCopa(copa);

  function resolver(meus, deles) {
    let euVenci;
    if (meus > deles) euVenci = true;
    else if (deles > meus) euVenci = false;
    else euVenci = Math.random() < 0.5; // empate no mata-mata -> pênaltis (moeda)

    if (!euVenci) return telaCopaEliminado(adversario, meus, deles);

    // avança: monta a próxima rodada (você passou; os outros jogos são simulados)
    const prox = [];
    for (let i = 0; i < copa.vivos.length; i += 2) {
      const a = copa.vivos[i], b = copa.vivos[i + 1];
      if (a === copa.meuTime || b === copa.meuTime) {
        prox.push(copa.meuTime);
      } else {
        const r = simularPartidaSelecao(a, b);
        prox.push((r[0] > r[1]) ? a : (r[1] > r[0]) ? b : (Math.random() < 0.5 ? a : b));
      }
    }
    copa.vivos = prox;
    salvarObjeto("copa", copa);
    if (copa.vivos.length === 1) return telaCopaCampeao();
    telaCopaRodada();
  }

  if (modo === "jogar") jogarPartida(resolver, "copa");
  else { const r = simularPartidaSelecao(copa.meuTime, adversario); resolver(r[0], r[1]); }
}

function telaCopaCampeao() {
  const en = carregar("config") === "English";
  const nac = (carregarObjeto("player") || {}).nacionalidade;
  adicionarTitulo("mundial"); // troféu supremo!
  salvar("campeaoAtual", nac); // sua seleção vira a campeã atual (a mais forte na próxima Copa)!
  apagar("copa");
  tela.innerHTML = `
    <h2>${en ? "WORLD CHAMPIONS!" : "CAMPEÕES DO MUNDO!"} 🏆🌍</h2>
    <p class="importante">${en ? `${nac} WINS THE WORLD CUP! You are a LEGEND!` : `${nac} É CAMPEÃ DA COPA DO MUNDO! Você é uma LENDA!`}</p>
    <button onclick="telaSelecao()">${en ? "GLORY!" : "GLÓRIA!"}</button>
  `;
}

function telaCopaEliminado(adversario, meus, deles) {
  const en = carregar("config") === "English";
  const copa = carregarObjeto("copa");
  const fase = copa ? faseNomeCopa(copa.vivos.length, en) : "";
  apagar("copa");
  tela.innerHTML = `
    <h2>${en ? "KNOCKED OUT" : "ELIMINADO"} 😞</h2>
    <p>${en ? `Lost ${meus}-${deles} to ${adversario} (${fase}).` : `Perdeu de ${meus} a ${deles} pra ${adversario} (${fase}).`}</p>
    <p>${en ? "The World Cup ends here for you. Next one in 4 seasons!" : "A Copa acaba aqui pra você. A próxima é daqui a 4 temporadas!"}</p>
    <button onclick="telaSelecao()">${en ? "Back" : "Voltar"}</button>
  `;
}
