// player.js — conversão do Player_creation.py (criação do jogador).
// No terminal era pergunta por pergunta; na web é um formulário só, com um botão que valida tudo.

const POSICOES = ["CF", "CAM", "CDM", "CB", "LW", "RW"];

// Os atributos de cada grupo. id = etiqueta interna FIXA; pt/en = rótulo na tela.
const FUTEBOL = [
  { id: "chute",    pt: "Chute",            en: "Shot" },
  { id: "passe",    pt: "Passe",            en: "Pass" },
  { id: "conducao", pt: "Condução de bola", en: "Ball control" },
  { id: "drible",   pt: "Drible",           en: "Dribble" },
];
const FISICO = [
  { id: "forca",      pt: "Força",      en: "Strength" },
  { id: "agilidade",  pt: "Agilidade",  en: "Agility" },
  { id: "equilibrio", pt: "Equilíbrio", en: "Balance" },
  { id: "folego",     pt: "Fôlego",     en: "Stamina" },
];


// Monta o HTML de um grupo de atributos (com o orçamento de pontos)
function grupoHTML(titulo, pontos, lista, en) {
  const aviso = en ? `you have ${pontos} points` : `você tem ${pontos} pontos`;
  let html = `<h3>${titulo} (${aviso})</h3>`;
  for (const s of lista) {
    const nome = en ? s.en : s.pt;
    html += `<label>${nome}: <input type="number" id="${s.id}" value="0" min="0"></label><br>`;
  }
  return html;
}


// Mostra a tela de criação (equivale aos vários input() do Python)
function telaCriacao() {
  const en = carregar("config") === "English";

  let opcoes = "";
  for (const p of POSICOES) {
    opcoes += `<option value="${p}">${p}</option>`;
  }

  tela.innerHTML = `
    <h2>${en ? "Create your player" : "Crie seu jogador"}</h2>
    <label>${en ? "Name" : "Nome"}: <input type="text" id="nome"></label><br>
    <label>${en ? "Age" : "Idade"}: <input type="number" id="idade" value="18"></label><br>
    <label>${en ? "Position" : "Posição"}: <select id="posicao">${opcoes}</select></label>

    ${grupoHTML("FUTEBOL / FOOTBALL", 20, FUTEBOL, en)}
    ${grupoHTML("FÍSICO / PHYSICAL", 15, FISICO, en)}

    <br>
    <button onclick="criarJogador()">${en ? "Create" : "Criar"}</button>
    <p id="erro" style="color:#f85149;"></p>
  `;
}


// Lê um número de um campo. Se não for número, vira 0 (é o try/except da web).
function lerNumero(id) {
  const v = parseInt(document.getElementById(id).value);
  return isNaN(v) ? 0 : v;
}


// Roda ao clicar em "Criar": valida os pontos e salva o jogador
function criarJogador() {
  const en = carregar("config") === "English";
  const erro = document.getElementById("erro");

  const nome = document.getElementById("nome").value.trim();
  const idade = document.getElementById("idade").value.trim();
  const posicao = document.getElementById("posicao").value;

  if (nome === "") {
    erro.textContent = en ? "Type a name!" : "Digite um nome!";
    return;
  }

  // Lê os atributos e soma cada grupo
  const player = { nome: nome, idade: idade, posicao: posicao };
  let somaFut = 0, somaFis = 0;
  for (const s of FUTEBOL) { player[s.id] = lerNumero(s.id); somaFut += player[s.id]; }
  for (const s of FISICO) { player[s.id] = lerNumero(s.id); somaFis += player[s.id]; }

  // Valida os orçamentos (igual ao while True do Python)
  if (somaFut !== 20) {
    erro.textContent = en
      ? `Football must total 20 (you used ${somaFut}).`
      : `Futebol tem que somar 20 (você usou ${somaFut}).`;
    return;
  }
  if (somaFis !== 15) {
    erro.textContent = en
      ? `Physical must total 15 (you used ${somaFis}).`
      : `Físico tem que somar 15 (você usou ${somaFis}).`;
    return;
  }

  // Tudo certo: salva o jogador (equivale ao Stats.txt)
  salvarObjeto("player", player);

  tela.innerHTML = `
    <p>${en ? "Player created" : "Jogador criado"}: ${nome}, ${idade}, ${posicao}!</p>
    <button onclick="telaCarreira()">${en ? "Continue" : "Continuar"}</button>
  `;
}
