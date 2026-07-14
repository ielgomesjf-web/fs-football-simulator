// penalty.js — conversão do Penalty.py (sistema de pênalti).
// Terminal: input do canto + time.sleep. Web: botões de canto + await delay.

// Espera X milissegundos (é o time.sleep da web). Usado com "await".
function delay(ms) {
  return new Promise(function (resolve) { setTimeout(resolve, ms); });
}

// Rola um dado de N lados (1 a N)
function dado(n) {
  return Math.floor(Math.random() * n) + 1;
}

// REGRA DO PÊNALTI (função pura, igual à do Python)
function resultadoPenalti(alvo, rollChute, rollGoleiro, cantoGoleiro, buffChute) {
  let goleiroDefende;
  if (rollGoleiro >= 15) {
    goleiroDefende = true;
  } else if (rollGoleiro >= 12 && alvo === cantoGoleiro) {
    goleiroDefende = true;
  } else {
    goleiroDefende = false;
  }
  const chuteTotal = rollChute + buffChute;
  if (chuteTotal >= 12 && !goleiroDefende) {
    return "GOL";
  }
  return "PERDEU";
}

// Buff = o atributo de Chute do jogador (0 se não houver jogador)
function lerBuffChute() {
  const p = carregarObjeto("player");
  return p ? (p.chute || 0) : 0;
}

// O desenho do gol (String.raw deixa os \ do desenho como estão)
const GOL_ASCII = String.raw`
      [1]o=============================o[2]
      |/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/|
      | X X  X  X  X  X  X  X  X  X  X X  |
      |/\/\/\/\/\/\/\/\  O   /\/\/\/\/\/\/|
      |\/\/\/\/\/\/\/\/ /|\  \/\/\/\/\/\/\|
      | X  X  X  X X X  / \  X  X  X  X X |
      |/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/\/|
      [3]o=============================o[4]
     ______________________________________
                  o    (@)
                 /|\
                 / \
`;

let _penaltiCallback = null; // pra onde ir quando o pênalti terminar

// Mostra a tela do pênalti. callback (opcional) recebe "GOL"/"PERDEU" no fim.
function jogarPenalti(callback) {
  _penaltiCallback = callback || null;
  const en = carregar("config") === "English";

  let botoes = "";
  for (let i = 1; i <= 4; i++) {
    botoes += `<button onclick="baterPenalti(${i})">${i}</button>`;
  }

  tela.innerHTML = `
    <pre>${GOL_ASCII}</pre>
    <p class="importante">${en ? "Choose the corner to shoot:" : "Escolha o canto pra chutar:"}</p>
    <p>1 = ${en ? "top-left" : "cima-esq"} | 2 = ${en ? "top-right" : "cima-dir"} |
       3 = ${en ? "bottom-left" : "baixo-esq"} | 4 = ${en ? "bottom-right" : "baixo-dir"}</p>
    <div id="cantos">${botoes}</div>
    <div id="penaltiResultado"></div>
  `;
}

// Roda ao clicar num canto (equivale ao jogar_penalti do Python)
async function baterPenalti(alvo) {
  const en = carregar("config") === "English";
  document.getElementById("cantos").innerHTML = ""; // tira os botões (sem clicar 2x)
  const res = document.getElementById("penaltiResultado");

  const buff = lerBuffChute();
  const rollChute = dado(20);
  const rollGoleiro = dado(20);
  const cantoGoleiro = dado(4);
  const chuteTotal = rollChute + buff;

  res.innerHTML = `<p>${en ? "Taking the penalty..." : "Batendo o pênalti..."}</p>`;
  await delay(900);
  res.innerHTML += `<p>${en ? "You shot" : "Você chutou"}! (${rollChute} + ${buff} = ${chuteTotal})</p>`;
  await delay(900);

  let gk;
  if (rollGoleiro >= 15) {
    gk = en ? "The goalkeeper read it and dived perfectly!" : "O goleiro leu a jogada e se jogou certeiro!";
  } else if (rollGoleiro >= 12) {
    gk = en ? `The goalkeeper jumped to corner ${cantoGoleiro}!` : `O goleiro pulou pro canto ${cantoGoleiro}!`;
  } else {
    gk = en ? "The goalkeeper went the wrong way!" : "O goleiro foi pro lado errado!";
  }
  res.innerHTML += `<p>${gk}</p>`;
  await delay(900);

  const resultado = resultadoPenalti(alvo, rollChute, rollGoleiro, cantoGoleiro, buff);
  let msg;
  if (resultado === "GOL") {
    msg = en ? "GOOOAL! What a goal!" : "GOOOL! Que golaço!";
  } else if (chuteTotal < 12) {
    msg = en ? "Missed! The shot was weak and went wide." : "Perdeu! O chute foi fraco e a bola foi pra fora.";
  } else {
    msg = en ? "Saved! The goalkeeper caught it." : "Defendeu! O goleiro pegou seu chute.";
  }
  res.innerHTML += `<p class="importante">${msg}</p>`;

  // "Retorna" o resultado: chama o callback, ou mostra a mensagem de próxima parte
  if (_penaltiCallback) {
    _penaltiCallback(resultado);
  } else {
    res.innerHTML += `<p style="color:#8b949e;">${en ? "(next part coming soon)" : "(próxima parte em breve)"}</p>`;
  }
}
