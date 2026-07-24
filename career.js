// career.js — conversão do Career_mode.py (escolha do time no Modo Carreira).
// No terminal: lista numerada + input. Na web: um botão por time.

const TIMES_INICIAIS = ["Coritiba", "Villarreal", "Leicester"];

// Mostra a tela de escolha do time
function telaCarreira() {
  const en = carregar("config") === "English";

  let botoes = "";
  for (const t of TIMES_INICIAIS) {
    botoes += `<button onclick="escolherTime('${t}')">${t}</button>`;
  }

  tela.innerHTML = `
    <h2>${en ? "Welcome to Career Mode!" : "Bem-vindo ao Modo Carreira!"}</h2>
    <p>${en ? "Choose your team:" : "Escolha o seu time:"}</p>
    ${botoes}
  `;
}

// Roda ao clicar num time (equivale ao times[escolha-1] + salvar do Python)
function escolherTime(time) {
  const en = carregar("config") === "English";
  salvar("team", time); // igual ao Team.txt

  tela.innerHTML = `
    <p>${en ? "You chose" : "Você escolheu o"} ${time}!</p>
    <button onclick="telaTutorial()">${en ? "Continue" : "Continuar"}</button>
  `;
}
