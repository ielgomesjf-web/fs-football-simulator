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
  for (const n of times) t[n] = { pts: 0, gp: 0, gc: 0 };
  return t;
}

function aplicarResultado(t, A, gA, B, gB) {
  t[A].gp += gA; t[A].gc += gB;
  t[B].gp += gB; t[B].gc += gA;
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

// Tela da temporada (simula + classificação + campeão + continental)
function telaTemporada() {
  const en = carregar("config") === "English";
  const meuTime = carregar("team");
  const liga = ligaDoTime(meuTime);
  const ordenados = simularLiga(liga.times);

  let linhas = "";
  let pos = 1;
  for (const t of ordenados) {
    const marca = (t.nome === meuTime) ? "  <==" : "";
    linhas += `${String(pos).padStart(2)}  ${t.nome.padEnd(18)} ${String(t.d.pts).padStart(3)}${marca}\n`;
    pos++;
  }

  const campeao = ordenados[0].nome;
  const comp = COMPETICAO_CONTINENTAL[liga.nome] || "Euro Campeões Liga";
  const top4 = [ordenados[0].nome, ordenados[1].nome, ordenados[2].nome, ordenados[3].nome];
  const classificou = top4.includes(meuTime);

  tela.innerHTML = `
    <h2>${en ? "FINAL STANDINGS" : "CLASSIFICAÇÃO FINAL"} — ${liga.nome}</h2>
    <pre>${linhas}</pre>
    <p class="importante">${en ? "CHAMPION" : "CAMPEÃO"}: ${campeao}!</p>
    <p>${en ? "Qualified for" : "Classificados pra"} ${comp}: ${top4.join(", ")}</p>
    <p class="${classificou ? "importante" : ""}">${classificou
      ? (en ? "Your team qualified!" : "Seu time se classificou!")
      : (en ? "Your team didn't qualify this time." : "Seu time não se classificou dessa vez.")}</p>
    <button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>
  `;
}
