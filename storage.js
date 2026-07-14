// storage.js — guarda o progresso do jogo no navegador.
// É o "sistema de arquivos" da versão web: substitui os .txt do Python.
//
//   Python:  with open("config.txt", "w") as f: f.write("Portuguese")
//   Web:     salvar("config", "Portuguese")
//
//   Python:  with open("config.txt") as f: idioma = f.read()
//   Web:     let idioma = carregar("config")

function salvar(chave, valor) {
  // guarda um valor com um nome (chave), tipo um arquivo
  localStorage.setItem("fs_" + chave, valor);
}

function carregar(chave) {
  // lê o valor. Se não existir, devolve "" (string vazia)
  return localStorage.getItem("fs_" + chave) || "";
}

// Salva um OBJETO inteiro (tipo o dicionário do Python: {nome: "Ney", chute: 5, ...}).
// JSON.stringify transforma o objeto em texto pra caber no localStorage.
function salvarObjeto(chave, objeto) {
  localStorage.setItem("fs_" + chave, JSON.stringify(objeto));
}

// Lê o objeto de volta (JSON.parse transforma o texto em objeto). null se não existir.
function carregarObjeto(chave) {
  const texto = localStorage.getItem("fs_" + chave);
  return texto ? JSON.parse(texto) : null;
}

// Apaga uma chave (usado no "Novo jogo")
function apagar(chave) {
  localStorage.removeItem("fs_" + chave);
}
