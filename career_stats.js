// career_stats.js — conversão do Career_stats.py (estatísticas da carreira).
// Guarda um objeto no localStorage (no lugar do Career_stats.txt).

// Chaves internas FIXAS (não mudam de idioma); os rótulos é que são traduzidos.
const CAMPOS = ["Gols", "Assistencias", "Partidas", "Defesas"];

function carregarStats() {
  const stats = carregarObjeto("career") || {};
  // garante que todos os campos existem (mesmo num save antigo)
  for (const c of CAMPOS) {
    if (!(c in stats)) {
      stats[c] = 0;
    }
  }
  return stats;
}

function salvarStats(stats) {
  salvarObjeto("career", stats);
}

// Soma 'quantidade' num campo (ex: adicionar(stats, "Gols") soma 1 gol)
function adicionar(stats, campo, quantidade = 1) {
  stats[campo] = (stats[campo] || 0) + quantidade;
  return stats;
}

// ===== TÍTULOS (troféus da carreira) =====
// Guarda quantos títulos de liga e continentais o jogador já ganhou.
function carregarTitulos() {
  return carregarObjeto("titulos") || { liga: 0, continental: 0 };
}

function adicionarTitulo(tipo) { // tipo: "liga" ou "continental"
  const t = carregarTitulos();
  t[tipo] = (t[tipo] || 0) + 1;
  salvarObjeto("titulos", t);
}

// Texto dos troféus (reusado na Carreira e na aposentadoria)
function textoTitulos(en) {
  const t = carregarTitulos();
  const total = (t.liga || 0) + (t.continental || 0) + (t.mundial || 0);
  if (total === 0) {
    return en ? "No titles yet — go win one!" : "Nenhum título ainda — vá conquistar um!";
  }
  return en
    ? `League titles:      ${t.liga || 0}\nContinental titles: ${t.continental || 0}\nWorld Cups:         ${t.mundial || 0}`
    : `Títulos de liga:        ${t.liga || 0}\nTítulos continentais:   ${t.continental || 0}\nCopas do Mundo:         ${t.mundial || 0}`;
}

// Mostra a tela da carreira (bilíngue)
function mostrarStats() {
  const en = carregar("config") === "English";
  const s = carregarStats();
  tela.innerHTML = `
    <h2>${en ? "YOUR CAREER" : "SUA CARREIRA"}</h2>
    <p>${en ? "Goals" : "Gols"}: ${s.Gols}</p>
    <p>${en ? "Assists" : "Assistências"}: ${s.Assistencias}</p>
    <p>${en ? "Defenses" : "Defesas"}: ${s.Defesas}</p>
    <p>${en ? "Matches" : "Partidas"}: ${s.Partidas}</p>
    <h3>🏆 ${en ? "Trophies" : "Troféus"}</h3>
    <pre>${textoTitulos(en)}</pre>
    <button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>
  `;
}
