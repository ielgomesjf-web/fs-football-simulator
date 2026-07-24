// menu.js — conversão do Menu.py (seleção de idioma).
// No terminal era: print(logo) -> input() -> if idioma.
// Na web é: mostrar a tela com botões -> o clique chama a função.

// A "tela" onde tudo aparece (a <div id="tela"> do index.html)
const tela = document.getElementById("tela");

// O desenho do FS. Repara nos \\ : em JS, \\ vira um \ só.
const LOGO = `
======================================
            ____    _____
            |      /
            |___   \\
            |       -----
            |            |
            |            /
            |       -----
======================================
`;

// Mostra a tela de escolha de idioma (equivale ao print + input do Python)
function telaIdioma() {
  tela.innerHTML = `
    <pre>${LOGO}</pre>
    <p>Language / Linguagem:</p>
    <button onclick="escolherIdioma('English')">1 - English</button>
    <button onclick="escolherIdioma('Portuguese')">2 - Português</button>
  `;
}

// Roda quando o jogador clica num botão de idioma (equivale ao if/elif do Python)
function escolherIdioma(idioma) {
  salvar("config", idioma); // igual ao config.txt do Python

  if (idioma === "English") {
    tela.innerHTML = `
      <p>Language set to English!</p>
      <p>Welcome to FS - Football Simulator. This game is a soccer game where
         you create your own player and face special challenges.</p>
      <button onclick="telaCriacao()">Continue</button>
    `;
  } else {
    tela.innerHTML = `
      <p>Idioma definido para Português!</p>
      <p>Bem vindo ao FS - Football Simulator. Este jogo é um jogo de futebol
         em que você cria seu próprio jogador e enfrenta desafios especiais.</p>
      <button onclick="telaCriacao()">Continuar</button>
    `;
  }
}

// Ao abrir o jogo: se já tem um jogador salvo, oferece Continuar; senão, começa novo.
function iniciar() {
  const player = carregarObjeto("player");
  if (player && carregar("config")) {
    telaInicio(player);
  } else {
    telaIdioma();
  }
}

// Tela inicial de quem já tem jogo salvo
function telaInicio(player) {
  const en = carregar("config") === "English";
  tela.innerHTML = `
    <pre>${LOGO}</pre>
    <p class="importante">${en ? "Welcome back" : "Bem-vindo de volta"}, ${player.nome}!</p>
    <button onclick="hub()">${en ? "Continue" : "Continuar"}</button>
    <button onclick="novoJogo()">${en ? "New game" : "Novo jogo"}</button>
  `;
}

// Novo jogo: apaga o jogo atual (com confirmação) e volta pra criação
function novoJogo() {
  const en = carregar("config") === "English";
  const ok = confirm(en
    ? "New game? Your current player will be lost if you didn't save it."
    : "Novo jogo? Seu jogador atual será perdido se você não tiver salvado.");
  if (!ok) return;
  const chaves = ["player", "team", "money", "career", "skills", "xp", "liga", "titulos", "suspenso", "temporada", "copa", "copaDraw", "campeaoAtual"];
  for (const k of chaves) {
    apagar(k);
  }
  telaIdioma();
}

// Começa o jogo
iniciar();
