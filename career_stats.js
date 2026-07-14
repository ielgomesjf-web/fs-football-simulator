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
    <button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>
  `;
}
