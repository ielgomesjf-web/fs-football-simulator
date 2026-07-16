// personagem.js — tela "Meu personagem": rosto ASCII + ficha (atributos, nível, XP).

// Rosto ASCII (String.raw pra manter os \ do desenho como estão)
const ROSTO_ASCII = String.raw`
              ___________
          ,##%%%%%%%%%%%##,
        ,##%%###########%%##,
       ,#%#################%#,
      ,#%###################%#,
     ,#%#####################%#,
     :#%##'''''''''''''''''##%#:
     ##%'                 '%##
    :#'                     '#:
    #'    .------.   .------.  '#
    #    /  ___   \ /  ___   \  #
    #   |  ( o )  | |  ( o )  | #
    #    \  '''  /   \  '''  /  #
    #     '-----'     '-----'   #
    #                           #
    #              /\           #
    #             /  \          #
    #             |  |          #
    #             \__/          #
    #                           #
    #,      .-----------.      ,#
    '#     (  \_______/  )     #'
     '#,                     ,#'
       '#,                 ,#'
         '#%,           ,%#'
            '%%#,,,,,#%%'
               '%%%%%%'
`;

// Mostra a tela do personagem
function telaPersonagem() {
  const en = carregar("config") === "English";
  const p = carregarObjeto("player");

  if (!p) {
    tela.innerHTML = `
      <h2>${en ? "MY CHARACTER" : "MEU PERSONAGEM"}</h2>
      <p>${en ? "No character yet." : "Nenhum personagem ainda."}</p>
      <button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>
    `;
    return;
  }

  const xp = carregarObjeto("xp") || {};

  // Ficha dos atributos (nível + XP)
  let ficha = "";
  for (const a of todosAtributos()) {
    const nome = (en ? a.en : a.pt).padEnd(16);
    const nivel = p[a.id] || 0;
    const xpAtual = xp[a.id] || 0;
    ficha += `${nome} ${en ? "lv" : "nv"} ${String(nivel).padStart(2)}  (XP ${xpAtual}/${xpNecessario(nivel)})\n`;
  }

  tela.innerHTML = `
    <h2>${en ? "MY CHARACTER" : "MEU PERSONAGEM"}</h2>
    <pre>${ROSTO_ASCII}</pre>
    <p class="importante">${p.nome} — ${p.idade} ${en ? "y/o" : "anos"} — ${p.posicao}</p>
    <p>${en ? "Money" : "Dinheiro"}: ${formatar(carregarDinheiro())}</p>
    <pre>${ficha}</pre>
    <button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>
  `;
}
