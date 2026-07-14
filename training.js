// training.js — conversão do Training.py (treino com XP).
// 6 "dias": a cada dia o jogador clica num atributo e ganha 10 XP nele.
// XP suficiente -> sobe de nível. Nível fica no player; XP num objeto "xp".

const XP_POR_TREINO = 10;
const DIAS_TREINO = 6;

// XP pra subir DESTE nível pro próximo (ex: nível 10 -> 100)
function xpNecessario(nivel) {
  return Math.max(nivel, 1) * 10;
}

// Soma XP e sobe de nível enquanto der. Devolve { nivel, xp } (JS não tem tupla).
function treinarAtributo(nivel, xp, ganho) {
  xp = xp + ganho;
  while (xp >= xpNecessario(nivel)) {
    xp = xp - xpNecessario(nivel);
    nivel = nivel + 1;
  }
  return { nivel: nivel, xp: xp };
}

// Todos os atributos treináveis (reusa as listas do player.js)
function todosAtributos() {
  return FUTEBOL.concat(FISICO).concat(SOCIAL);
}

let _diaTreino = 1;
let _treinoDepois = null; // função pra rodar quando o treino acabar (null = volta pro hub)

// Abre o treino (dia 1). 'depois' (opcional) = pra onde ir no fim.
function telaTreino(depois) {
  _treinoDepois = depois || null;
  _diaTreino = 1;
  mostrarDiaTreino("");
}

// Chamado no fim do treino: vai pro destino escolhido (ou hub)
function voltarDoTreino() {
  if (_treinoDepois) {
    _treinoDepois();
  } else {
    hub();
  }
}

function mostrarDiaTreino(aviso) {
  const en = carregar("config") === "English";
  const player = carregarObjeto("player");
  const xp = carregarObjeto("xp") || {};

  let html = `<h2>${en ? `Training day ${_diaTreino} of ${DIAS_TREINO}` : `Dia ${_diaTreino} de ${DIAS_TREINO} de treino`}</h2>`;
  if (aviso) {
    html += `<p class="importante">${aviso}</p>`;
  }
  html += `<p>${en ? "Click an attribute to train (+10 XP):" : "Clique num atributo pra treinar (+10 XP):"}</p>`;

  for (const a of todosAtributos()) {
    const nivel = player[a.id] || 0;
    const xpAtual = xp[a.id] || 0;
    const nome = en ? a.en : a.pt;
    html += `<p>${nome}: ${en ? "level" : "nível"} ${nivel} (XP ${xpAtual}/${xpNecessario(nivel)})
      <button onclick="treinarDia('${a.id}')">+${XP_POR_TREINO} XP</button></p>`;
  }
  tela.innerHTML = html;
}

// Treina um atributo (equivale a escolher no dia do Python)
function treinarDia(id) {
  const en = carregar("config") === "English";
  const player = carregarObjeto("player");
  const xp = carregarObjeto("xp") || {};

  const nivelAntes = player[id] || 0;
  const r = treinarAtributo(nivelAntes, xp[id] || 0, XP_POR_TREINO);
  player[id] = r.nivel;
  xp[id] = r.xp;
  salvarObjeto("player", player);
  salvarObjeto("xp", xp);

  const subiu = r.nivel > nivelAntes;
  const aviso = subiu
    ? (en ? `Leveled up to level ${r.nivel}!` : `Subiu pro nível ${r.nivel}!`)
    : (en ? `+${XP_POR_TREINO} XP` : `+${XP_POR_TREINO} XP`);

  _diaTreino++;
  if (_diaTreino > DIAS_TREINO) {
    tela.innerHTML = `
      <h2>${en ? "Training finished!" : "Treino concluído!"}</h2>
      <p>${aviso}</p>
      <button onclick="voltarDoTreino()">${en ? "Continue" : "Continuar"}</button>
    `;
  } else {
    mostrarDiaTreino(aviso);
  }
}
