// tutorial.js — conversão do Tutorial.py.
// Lê a posição do jogador e mostra a cena; depois um pênalti de treino (não conta na carreira).

function telaTutorial() {
  const en = carregar("config") === "English";
  const p = carregarObjeto("player");
  const posicao = p ? p.posicao : "CF";

  const intro = en
    ? `<p>Hello, player! This is the tutorial. You must choose what to do according to what happens.</p>
       <p>Let's see what happens.</p>
       <p>Leissester VS Kolitiba - World Tournament Final!</p>`
    : `<p>Olá, jogador! Este é o tutorial. Você deve escolher o que fazer de acordo com os acontecimentos.</p>
       <p>Vamos ver o que acontece.</p>
       <p>Leissester VS Kolitiba - Final do Torneio do Mundo!</p>`;

  let cena, botao;
  if (posicao === "CB") {
    cena = en ? "The ball is with the opponent. Try to intercept!" : "A bola está com o adversário. Tente interceptar!";
    botao = en ? "Intercept" : "Interceptar";
  } else {
    cena = en ? "Look! It seems the ball reached you. Let's try to shoot!" : "Olha só! Parece que a bola chegou em você. Vamos tentar chutar!";
    botao = en ? "Shoot" : "Chutar";
  }

  tela.innerHTML = intro + `
    <p class="importante">${cena}</p>
    <button onclick="acaoTutorial('${posicao}')">${botao}</button>
  `;
}

// Depois da ação (chute/interceptação), o juiz marca pênalti de treino
function acaoTutorial(posicao) {
  const en = carregar("config") === "English";

  const sucesso = (posicao === "CB")
    ? (en ? "You intercepted the ball! Well done!" : "Você interceptou a bola! Mandou bem!")
    : (en ? "You shot! What a play!" : "Você chutou! Que jogada!");

  tela.innerHTML = `
    <p>${sucesso}</p>
    <p class="importante">${en ? "But the referee blew the whistle: PENALTY in your favor!" : "Mas o juiz apitou: PÊNALTI a seu favor!"}</p>
    <p style="color:#8b949e;">${en ? "(in the tutorial the goal doesn't count)" : "(no tutorial o gol não conta)"}</p>
    <button onclick="jogarPenalti(fimTutorial)">${en ? "Take the penalty" : "Bater o pênalti"}</button>
  `;
}

// Callback do pênalti do tutorial (o gol NÃO é salvo — é só treino)
function fimTutorial(resultado) {
  const en = carregar("config") === "English";
  const res = document.getElementById("penaltiResultado");
  res.innerHTML += `
    <p class="importante">${en ? "Tutorial finished!" : "Tutorial concluído!"}</p>
    <button onclick="hub()">${en ? "Start playing!" : "Começar a jogar!"}</button>
  `;
}
