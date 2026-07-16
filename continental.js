// continental.js — conversão do Continental.py (torneios continentais).
// Simula os classificados (reusa a liga do season.js) e joga o mata-mata.

function top4DaLiga(chave) {
  const ordenados = simularLiga(LIGAS[chave].times);
  return [ordenados[0].nome, ordenados[1].nome, ordenados[2].nome, ordenados[3].nome];
}

// Um confronto de mata-mata (precisa de vencedor; empate = pênaltis)
function confronto(a, b) {
  const res = simularPartidaLiga(a, b);
  let vencedor;
  if (res[0] > res[1]) vencedor = a;
  else if (res[1] > res[0]) vencedor = b;
  else vencedor = (Math.random() < 0.5) ? a : b;
  return { vencedor: vencedor, texto: `${a} ${res[0]} x ${res[1]} ${b}  ->  ${vencedor}` };
}

function nomeFase(n, en) {
  if (n >= 8) return en ? "Quarterfinals" : "Quartas de final";
  if (n === 4) return en ? "Semifinals" : "Semifinais";
  return "FINAL";
}

function telaContinental() {
  const en = carregar("config") === "English";
  const meuTime = carregar("team");
  const liga = ligaDoTime(meuTime);
  const comp = COMPETICAO_CONTINENTAL[liga.nome] || "Euro Campeões Liga";

  let qualificados;
  if (comp === "Libertados") {
    qualificados = top4DaLiga("Kolitiba");
  } else {
    qualificados = top4DaLiga("Leissester").concat(top4DaLiga("Vila Real"));
  }
  // garante o time do jogador no torneio
  if (!qualificados.includes(meuTime)) {
    qualificados[qualificados.length - 1] = meuTime;
  }

  let html = `<h2>${comp}</h2><p>${en ? "Qualified" : "Classificados"}: ${qualificados.join(", ")}</p>`;

  let atuais = embaralhar(qualificados);
  while (atuais.length > 1) {
    html += `<h3>${nomeFase(atuais.length, en)}</h3><pre>`;
    const prox = [];
    for (let i = 0; i < atuais.length; i += 2) {
      const c = confronto(atuais[i], atuais[i + 1]);
      html += c.texto + "\n";
      prox.push(c.vencedor);
    }
    html += `</pre>`;
    atuais = prox;
  }

  const campeao = atuais[0];
  html += `<p class="importante">${en ? `${comp} CHAMPION` : `CAMPEÃO DA ${comp}`}: ${campeao}!</p>`;
  if (campeao === meuTime) {
    html += `<p class="importante">${en ? "YOU WON THE CONTINENTAL TITLE!" : "VOCÊ FOI CAMPEÃO CONTINENTAL!"}</p>`;
    // registra o título — no máximo 1 por temporada (pra não "farmar" reabrindo a tela)
    const persist = carregarLiga();
    if (persist && !persist.contGanha) {
      adicionarTitulo("continental");
      persist.contGanha = true;
      salvarLiga(persist);
    } else if (persist && persist.contGanha) {
      html += `<p>${en ? "(Already counted this season.)" : "(Já contou nesta temporada.)"}</p>`;
    } else {
      adicionarTitulo("continental"); // sem liga em andamento (caso raro)
    }
  }
  html += `<button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>`;
  tela.innerHTML = html;
}
