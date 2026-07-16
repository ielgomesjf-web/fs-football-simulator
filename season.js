// season.js — conversão do Season.py (liga/temporada).
// Na web, a temporada SIMULA a liga (rápido) e mostra a classificação, campeão e classificados.
// (Partidas avulsas jogáveis ficam no "Jogar partida" do menu.)

const LIGAS = {
  "Kolitiba": {
    nome: "Brasilzão",
    times: [
      "Kolitiba", "Flamável FC", "Corintianos", "Palmares SE", "São Paulino",
      "Gremista FC", "Vasco do Gomes", "Santástico", "Cruzado EC", "Atlântico MG",
      "Botarfogo", "Fluminante", "Internético", "Baianão", "Fortão EC",
      "Atleticano PR", "Cearense SC", "Goianão", "Cuiabano", "Bragança RB",
    ],
  },
  "Vila Real": {
    nome: "Uma Liga",
    times: [
      "Vila Real", "Real Madril", "Barcelonense", "Atleti Madril", "Sevilhano",
      "Betico", "Realito Sociedade", "Villa Amarela", "Getáfico", "Osasúna",
      "Celta de Vigor", "Rayo Vallecas", "Málagão", "Espanhol FC", "Granadão",
      "Almerião", "Cádiz FC", "Elche CF", "Levânte", "Bilbau Athletic",
    ],
  },
  "Leissester": {
    nome: "Liga Premiada",
    times: [
      "Leissester", "Manchester Vermelho", "Manchester Azul", "Liverpudle", "Chelsington",
      "Arsênico", "Totemham", "Newcastelo", "Astão Villa", "Everfton",
      "Brightão", "Wolverhampon", "Cristal Palácio", "Fulhão", "Brentfort",
      "Nottingão Florest", "Bornemoufe", "Sheffild", "Burnlei", "West Ram",
    ],
  },
};

const PONTOS_VITORIA = 3;
const PONTOS_EMPATE = 1;
const RODADAS = 40;

const COMPETICAO_CONTINENTAL = {
  "Brasilzão": "Libertados",
  "Uma Liga": "Euro Campeões Liga",
  "Liga Premiada": "Euro Campeões Liga",
};

const CHANCES_INICIAL = 5;
const CHANCES_MEDIO = 8;
const CHANCES_GRANDE = 12;

// Descobre a liga do time procurando em todas
function ligaDoTime(meuTime) {
  for (const chave in LIGAS) {
    if (LIGAS[chave].times.includes(meuTime)) return LIGAS[chave];
  }
  return LIGAS["Kolitiba"];
}

// Força do time = chances por partida (TIMES_MEDIOS/GRANDES vêm do transfer.js)
function chancesDoTime(nome) {
  if (TIMES_GRANDES.includes(nome)) return CHANCES_GRANDE;
  if (TIMES_MEDIOS.includes(nome)) return CHANCES_MEDIO;
  return CHANCES_INICIAL;
}

function golsDe(chances) {
  let g = 0;
  for (let i = 0; i < chances; i++) {
    if (dado(4) === 1) g++; // cada chance ~25% de virar gol
  }
  return g;
}

function simularPartidaLiga(a, b) {
  return [golsDe(chancesDoTime(a)), golsDe(chancesDoTime(b))];
}

function novaTabela(times) {
  const t = {};
  for (const n of times) t[n] = { pts: 0, gp: 0, gc: 0, j: 0 };
  return t;
}

function aplicarResultado(t, A, gA, B, gB) {
  t[A].gp += gA; t[A].gc += gB; t[A].j += 1;
  t[B].gp += gB; t[B].gc += gA; t[B].j += 1;
  if (gA > gB) t[A].pts += PONTOS_VITORIA;
  else if (gB > gA) t[B].pts += PONTOS_VITORIA;
  else { t[A].pts += PONTOS_EMPATE; t[B].pts += PONTOS_EMPATE; }
}

function embaralhar(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
  }
  return a;
}

// comparador: pontos, depois saldo, depois gols pró
function compararTimes(x, y) {
  if (y.d.pts !== x.d.pts) return y.d.pts - x.d.pts;
  const sx = x.d.gp - x.d.gc, sy = y.d.gp - y.d.gc;
  if (sy !== sx) return sy - sx;
  return y.d.gp - x.d.gp;
}

function ordenarTabela(tabela) {
  const arr = [];
  for (const nome in tabela) arr.push({ nome: nome, d: tabela[nome] });
  arr.sort(compararTimes);
  return arr;
}

// Simula a liga inteira e devolve a tabela ordenada
function simularLiga(times) {
  const tabela = novaTabela(times);
  for (let r = 0; r < RODADAS; r++) {
    const bar = embaralhar(times);
    for (let i = 0; i < bar.length; i += 2) {
      const res = simularPartidaLiga(bar[i], bar[i + 1]);
      aplicarResultado(tabela, bar[i], res[0], bar[i + 1], res[1]);
    }
  }
  return ordenarTabela(tabela);
}

// ===== LIGA PERSISTENTE (a tabela fica salva; suas partidas contam de verdade) =====

function carregarLiga() { return carregarObjeto("liga"); }
function salvarLiga(liga) { salvarObjeto("liga", liga); }

// Gera os jogos de uma rodada: embaralha e forma pares
function gerarJogosRodada(times) {
  const bar = embaralhar(times);
  const jogos = [];
  for (let i = 0; i < bar.length; i += 2) jogos.push([bar[i], bar[i + 1]]);
  return jogos;
}

// Começa uma liga nova pro time do jogador
function novaLiga(meuTime) {
  const liga = ligaDoTime(meuTime);
  const state = {
    nomeLiga: liga.nome,
    times: liga.times.slice(),
    meuTime: meuTime,
    tabela: novaTabela(liga.times),
    rodada: 1,
    jogosRodada: gerarJogosRodada(liga.times),
    contGanha: false, // já ganhou a continental nesta temporada? (evita farmar título)
  };
  salvarLiga(state);
  return state;
}

// Acha o adversário do jogador na rodada atual
function adversarioNaRodada(liga) {
  for (const par of liga.jogosRodada) {
    if (par[0] === liga.meuTime) return par[1];
    if (par[1] === liga.meuTime) return par[0];
  }
  return null;
}

// Monta o HTML da classificação (posição, J, Pts, Saldo; destaca seu time)
function classificacaoHTML(liga) {
  const en = carregar("config") === "English";
  const ordenados = ordenarTabela(liga.tabela);
  let linhas = ` #  ${(en ? "Team" : "Time").padEnd(18)}  J  Pts   SG\n`;
  let pos = 1;
  for (const t of ordenados) {
    const saldo = t.d.gp - t.d.gc;
    const sg = (saldo >= 0 ? "+" : "") + saldo;
    const marca = (t.nome === liga.meuTime) ? "  <==" : "";
    linhas += `${String(pos).padStart(2)}  ${t.nome.padEnd(18)} ${String(t.d.j).padStart(2)} ${String(t.d.pts).padStart(3)}  ${sg.padStart(3)}${marca}\n`;
    pos++;
  }
  const rodadaMostrar = Math.min(liga.rodada, RODADAS);
  return `<h2>${liga.nomeLiga} — ${en ? "Round" : "Rodada"} ${rodadaMostrar}/${RODADAS}</h2><pre>${linhas}</pre>`;
}

// Tela da liga (o hub da temporada)
function telaTemporada() {
  const en = carregar("config") === "English";
  const meuTime = carregar("team");
  let liga = carregarLiga();

  // Sem liga, ou o jogador trocou de time (transferência) -> começa liga nova
  if (!liga || liga.meuTime !== meuTime) {
    liga = novaLiga(meuTime);
  }
  // Temporada acabou?
  if (liga.rodada > RODADAS) return telaFimTemporada(liga);

  const adversario = adversarioNaRodada(liga);
  tela.innerHTML = classificacaoHTML(liga) + `
    <p>${en ? "Your age" : "Sua idade"}: ${idadeDoJogador()} ${en ? "years" : "anos"}${idadeDoJogador() >= 40 ? (en ? " (age is dropping your stats!)" : " (a idade já derruba seus atributos!)") : ""}</p>
    <p class="importante">${en ? "Round" : "Rodada"} ${liga.rodada}: ${meuTime} vs ${adversario}</p>
    <button onclick="jogarRodadaLiga('jogar')">${en ? "Play my match" : "Jogar minha partida"}</button>
    <button onclick="jogarRodadaLiga('simular')">${en ? "Simulate round" : "Simular rodada"}</button>
    <button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>
  `;
}

// Joga/simula a rodada atual: a partida do jogador conta, os outros jogos são simulados
function jogarRodadaLiga(modo) {
  const liga = carregarLiga();
  const adversario = adversarioNaRodada(liga);

  function finalizar(meus, deles) {
    // resultado do jogador
    aplicarResultado(liga.tabela, liga.meuTime, meus, adversario, deles);
    // os outros jogos da rodada, simulados
    for (const par of liga.jogosRodada) {
      if (par[0] === liga.meuTime || par[1] === liga.meuTime) continue;
      const r = simularPartidaLiga(par[0], par[1]);
      aplicarResultado(liga.tabela, par[0], r[0], par[1], r[1]);
    }
    liga.rodada++;
    if (liga.rodada <= RODADAS) {
      liga.jogosRodada = gerarJogosRodada(liga.times);
    } else {
      // temporada acabou: se você terminou em 1º, ganha o título de liga
      const ordenados = ordenarTabela(liga.tabela);
      if (ordenados[0].nome === liga.meuTime) adicionarTitulo("liga");
    }
    salvarLiga(liga);
    telaTemporada(); // mostra a tabela atualizada (ou o fim da temporada)
  }

  if (modo === "jogar") {
    jogarPartida(finalizar, "liga"); // "liga" = no fim mostra a classificação, não treino/próxima
  } else {
    const r = simularPartidaLiga(liga.meuTime, adversario);
    finalizar(r[0], r[1]);
  }
}

// ===== IDADE E APOSENTADORIA =====
// Cada temporada = 1 ano. 35+: pode aposentar (opcional). 45: aposentadoria obrigatória.

function idadeDoJogador() {
  const p = carregarObjeto("player") || {};
  return parseInt(p.idade) || 18;
}

function definirIdade(nova) {
  const p = carregarObjeto("player") || {};
  p.idade = nova;
  salvarObjeto("player", p);
}

// Fim da temporada: campeão + classificados + idade/aposentadoria
function telaFimTemporada(liga) {
  const en = carregar("config") === "English";
  const ordenados = ordenarTabela(liga.tabela);
  const campeao = ordenados[0].nome;
  const comp = COMPETICAO_CONTINENTAL[liga.nomeLiga] || "Euro Campeões Liga";
  const top4 = [ordenados[0].nome, ordenados[1].nome, ordenados[2].nome, ordenados[3].nome];
  const classificou = top4.includes(liga.meuTime);
  const idade = idadeDoJogador();

  // Ações conforme a idade
  let acoes;
  if (idade >= 45) {
    acoes = `<p class="importante">${en ? "At 45, it's time to hang up the boots." : "Aos 45 anos, é hora de pendurar as chuteiras."}</p>
      <button onclick="telaAposentadoria(true)">${en ? "Retire" : "Aposentar"}</button>`;
  } else if (idade >= 35) {
    acoes = `<button onclick="novaTemporada()">${en ? "New season" : "Nova temporada"}</button>
      <button onclick="telaAposentadoria(false)">${en ? "Retire" : "Aposentar"}</button>
      <button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>`;
  } else {
    acoes = `<button onclick="novaTemporada()">${en ? "New season" : "Nova temporada"}</button>
      <button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>`;
  }

  tela.innerHTML = classificacaoHTML(liga) + `
    <p>${en ? "Your age" : "Sua idade"}: ${idade} ${en ? "years" : "anos"}</p>
    <p class="importante">${en ? "SEASON OVER! CHAMPION" : "FIM DA TEMPORADA! CAMPEÃO"}: ${campeao}!</p>
    <p>${en ? "Qualified for" : "Classificados pra"} ${comp}: ${top4.join(", ")}</p>
    <p class="${classificou ? "importante" : ""}">${classificou
      ? (en ? "Your team qualified!" : "Seu time se classificou!")
      : (en ? "Your team didn't qualify this time." : "Seu time não se classificou dessa vez.")}</p>
    ${acoes}
  `;
}

// Começa uma temporada nova: passa 1 ano (e, depois dos 39, os atributos caem)
function novaTemporada() {
  definirIdade(idadeDoJogador() + 1);
  if (idadeDoJogador() >= 40) declinarAtributos();
  novaLiga(carregar("team"));
  telaTemporada();
}

// Depois dos 39: perde 1 de cada atributo por ano (mínimo 0)
function declinarAtributos() {
  const p = carregarObjeto("player");
  if (!p) return;
  for (const a of todosAtributos()) {
    const atual = parseInt(p[a.id]) || 0;
    p[a.id] = Math.max(0, atual - 1);
  }
  salvarObjeto("player", p);
}

// Aposentadoria: resumo da carreira + começar carreira nova
function telaAposentadoria(forcada) {
  const en = carregar("config") === "English";
  const p = carregarObjeto("player") || {};
  const s = carregarStats();
  const motivo = forcada
    ? (en ? "The age caught up — a forced, but glorious, retirement." : "A idade chegou — aposentadoria forçada, mas gloriosa.")
    : (en ? "You chose the perfect moment to leave." : "Você escolheu a hora certa de sair.");
  tela.innerHTML = `
    <h2>${en ? "RETIREMENT" : "APOSENTADORIA"}</h2>
    <p>${motivo}</p>
    <p class="importante">${p.nome} ${en ? "retires at" : "se aposenta aos"} ${idadeDoJogador()} ${en ? "years old." : "anos."}</p>
    <p>${en ? "Career totals:" : "Números da carreira:"}</p>
    <pre>${en ? "Goals" : "Gols"}:    ${s.Gols}
${en ? "Assists" : "Assist."}:  ${s.Assistencias}
${en ? "Defenses" : "Defesas"}: ${s.Defesas}
${en ? "Matches" : "Partidas"}: ${s.Partidas}</pre>
    <p>${en ? "Trophy cabinet:" : "Sala de troféus:"} 🏆</p>
    <pre>${textoTitulos(en)}</pre>
    <p class="importante">${en ? "What a career! A legend hangs up the boots." : "Que carreira! Uma lenda pendura as chuteiras."}</p>
    <button onclick="novaCarreira()">${en ? "New career" : "Nova carreira"}</button>
  `;
}

// Nova carreira: apaga o jogador atual e cria um novo (mantém o idioma)
function novaCarreira() {
  const chaves = ["player", "team", "money", "career", "skills", "xp", "liga", "titulos"];
  for (const k of chaves) apagar(k);
  telaCriacao();
}
