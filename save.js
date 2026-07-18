// save.js — conversão do Save.py (salvar/carregar com vários slots).
// Um save = uma cópia das chaves do jogo, guardada dentro de "saves".

const GAME_KEYS = ["config", "player", "team", "money", "career", "skills", "xp", "liga", "titulos", "suspenso"];

function salvarJogo(nome) {
  const saves = carregarObjeto("saves") || {};
  const snap = {};
  for (const k of GAME_KEYS) {
    const v = localStorage.getItem("fs_" + k);
    if (v !== null) snap[k] = v;
  }
  saves[nome] = snap;
  salvarObjeto("saves", saves);
}

function carregarJogo(nome) {
  const saves = carregarObjeto("saves") || {};
  if (!saves[nome]) return false;
  const snap = saves[nome];
  for (const k of GAME_KEYS) {
    if (k in snap) localStorage.setItem("fs_" + k, snap[k]);
  }
  return true;
}

function listarSaves() {
  const saves = carregarObjeto("saves") || {};
  return Object.keys(saves);
}

function telaSave() {
  const en = carregar("config") === "English";
  const nomes = listarSaves();
  const lista = nomes.length ? nomes.join(", ") : (en ? "(none)" : "(nenhum)");

  tela.innerHTML = `
    <h2>${en ? "SAVE / LOAD" : "SALVAR / CARREGAR"}</h2>
    <p>Saves: ${lista}</p>
    <p>
      <input type="text" id="saveNome" placeholder="${en ? "save name" : "nome do save"}">
      <button onclick="salvarDoMenu()">${en ? "Save" : "Salvar"}</button>
      <button onclick="carregarDoMenu()">${en ? "Load" : "Carregar"}</button>
    </p>
    <div id="saveMsg" class="importante"></div>
    <button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>
  `;
}

function salvarDoMenu() {
  const en = carregar("config") === "English";
  const nome = document.getElementById("saveNome").value.trim();
  if (!nome) {
    document.getElementById("saveMsg").textContent = en ? "Type a name!" : "Digite um nome!";
    return;
  }
  salvarJogo(nome);
  telaSave();
  document.getElementById("saveMsg").textContent = en ? `Saved as '${nome}'!` : `Salvo em '${nome}'!`;
}

function carregarDoMenu() {
  const en = carregar("config") === "English";
  const nome = document.getElementById("saveNome").value.trim();
  if (carregarJogo(nome)) {
    telaSave();
    document.getElementById("saveMsg").textContent = en ? `Loaded '${nome}'!` : `Carregado '${nome}'!`;
  } else {
    document.getElementById("saveMsg").textContent = en ? "Save not found." : "Save não encontrado.";
  }
}
