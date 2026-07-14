// match.js — conversão do Match.py (a partida).
// No terminal era um loop; na web é uma máquina de estados: cada lance é uma tela.

// --- valores ajustáveis ---
const LIMIAR_GOL = 20;
const LIMIAR_DEFESA = 15;
const N_LANCES = 8;
const BUFF_DICA = 5;
const PREMIO_GOL = 10000;
const PREMIO_VITORIA = 50000;

// eventos e raridades (mais cópias = mais provável)
const EVENTOS_M = [
  ["ataque", "comum"], ["defense", "comum"],
  ["contra", "raro"], ["duelo", "raro"], ["dominar", "raro"], ["cruzamento", "raro"],
  ["penalty", "epico"],
];
const COPIAS_M = { comum: 10, raro: 3, epico: 1 };

// situações ofensivas (favorecem uma ação, que ganha buff)
const SITUACOES = [
  { pt: "Você recebe de frente pro gol...",              en: "You receive facing the goal...",       fav: "chutar" },
  { pt: "Você tem espaço na frente para continuar...",   en: "You have space to continue...",         fav: "driblar" },
  { pt: "Um companheiro está correndo pela ponta...",    en: "A teammate is running on the wing...",  fav: "passar" },
];

// Eventos de STAT (2 por atributo). Cada um usa 1 atributo; entram 2x no sorteio.
// res: "gol" (marca), "assist" (gol do time + assistência), "recuperar" (rouba a bola).
const EVENTOS_STAT = [
  // DRIBLE
  { id: "drible1", atr: "drible", buff: "driblar", res: "gol",
    pt: "Você encara o marcador no 1x1...", en: "You take on your marker 1-on-1...",
    ok_pt: "Driblou e finalizou! GOL!", ok_en: "Dribbled past and scored! GOAL!", no_pt: "Perdeu a bola no drible.", no_en: "Lost the ball on the dribble." },
  { id: "drible2", atr: "drible", buff: "driblar", res: "gol",
    pt: "Você tenta um drible ousado na área...", en: "You try a bold dribble in the box...",
    ok_pt: "Que jogada! GOL!", ok_en: "What a move! GOAL!", no_pt: "A defesa cortou.", no_en: "The defense cut it out." },
  // CHUTE (shoot)
  { id: "falta", atr: "chute", buff: "chutar", res: "gol",
    pt: "Falta perigosa! Você cobra...", en: "Dangerous free kick! You take it...",
    ok_pt: "GOOOL! No ângulo!", ok_en: "GOOOAL! Top corner!", no_pt: "Por cima do gol!", no_en: "Over the bar!" },
  { id: "chutefora", atr: "chute", buff: "chutar", res: "gol",
    pt: "Chute de fora da área!", en: "Long shot from outside the box!",
    ok_pt: "MÍSSIL! GOL de longe!", ok_en: "ROCKET! Goal from distance!", no_pt: "Pra fora.", no_en: "Wide." },
  // PASSE (pass)
  { id: "passe1", atr: "passe", buff: "passar", res: "assist",
    pt: "Lançamento longo pro companheiro...", en: "Long ball to your teammate...",
    ok_pt: "Passe perfeito, GOL do time! Assistência sua!", ok_en: "Perfect pass, GOAL! Your assist!", no_pt: "Interceptado.", no_en: "Intercepted." },
  { id: "passe2", atr: "passe", buff: "passar", res: "assist",
    pt: "Tabela rápida na entrada da área...", en: "Quick one-two at the edge of the box...",
    ok_pt: "Tabelou e saiu o GOL! Assistência sua!", ok_en: "One-two and GOAL! Your assist!", no_pt: "O passe não chegou.", no_en: "The pass didn't get there." },
  // FORÇA (strength) — o 2º de força; o duelo aéreo é separado (tem consequência)
  { id: "ombro", atr: "forca", buff: null, res: "recuperar",
    pt: "Ombro a ombro pela bola...", en: "Shoulder to shoulder for the ball...",
    ok_pt: "Você protege e mantém a posse!", ok_en: "You hold them off and keep the ball!", no_pt: "Perdeu no corpo.", no_en: "Muscled off the ball." },
  // AGILIDADE (others)
  { id: "corrida", atr: "agilidade", buff: null, res: "recuperar",
    pt: "Corrida pela bola! Chegue antes...", en: "A race for the ball! Get there first...",
    ok_pt: "Você chega primeiro e domina!", ok_en: "You get there first and control it!", no_pt: "O adversário chegou antes.", no_en: "The opponent got there first." },
  { id: "pique", atr: "agilidade", buff: null, res: "gol",
    pt: "Pique em velocidade pela ponta...", en: "A sprint down the wing...",
    ok_pt: "Deixou a defesa pra trás e marcou! GOL!", ok_en: "Left the defense behind and scored! GOAL!", no_pt: "A defesa alcançou.", no_en: "The defense caught up." },
];

// função pura: virou gol? (d20 + atributo >= limiar)
function ehGol(roll, atributo) {
  return roll + atributo >= LIMIAR_GOL;
}

// função pura: quanto Match XP a partida deu
function calcularMatchXp(gols, roubos, saldoGols) {
  let base;
  if (gols >= 4) base = 100;
  else if (gols >= 2 || roubos >= 2) base = 50;
  else base = 0;
  return Math.max(0, base + saldoGols * 10);
}

function lerAtributosMatch() {
  const p = carregarObjeto("player") || {};
  return {
    chute: p.chute || 0, passe: p.passe || 0, drible: p.drible || 0,
    forca: p.forca || 0, agilidade: p.agilidade || 0,
  };
}

let _m = null; // estado da partida

// Começa a partida. callbackFim(placarJ, placarA) roda no fim (ou vai pro hub).
function jogarPartida(callbackFim) {
  const sorteio = [];
  for (const par of EVENTOS_M) {
    for (let i = 0; i < COPIAS_M[par[1]]; i++) sorteio.push(par[0]);
  }
  // eventos de stat entram 2x cada
  for (const ev of EVENTOS_STAT) {
    sorteio.push(ev.id);
    sorteio.push(ev.id);
  }
  _m = {
    lance: 1, placarJ: 0, placarA: 0, gols: 0, assist: 0, roubos: 0,
    at: lerAtributosMatch(), sorteio: sorteio, callbackFim: callbackFim || null, situacao: null,
  };
  proximoLance();
}

function cabecalhoLance() {
  const en = carregar("config") === "English";
  return `<p><b>[${en ? "Play" : "Lance"} ${_m.lance}/${N_LANCES}] — ${_m.placarJ} x ${_m.placarA}</b></p>`;
}

function proximoLance() {
  if (_m.lance > N_LANCES) return fimPartida();
  const tipo = _m.sorteio[Math.floor(Math.random() * _m.sorteio.length)];
  if (tipo === "ataque") lanceAtaque();
  else if (tipo === "defense") lanceDefesa();
  else if (tipo === "contra") lanceContra();
  else if (tipo === "duelo") lanceDuelo();
  else if (tipo === "dominar") lanceDominar();
  else if (tipo === "cruzamento") lanceCruzamento();
  else if (tipo === "penalty") lancePenalti();
  else lanceStat(statEventPorId(tipo)); // eventos de stat (data-driven)
}

function avancarLance() {
  _m.lance++;
  proximoLance();
}

function botaoProximo() {
  const en = carregar("config") === "English";
  return `<button onclick="avancarLance()">${en ? "Next" : "Próximo"}</button>`;
}

// --- ATAQUE (interativo: escolhe a ação, com dica + buff) ---
function lanceAtaque() {
  const en = carregar("config") === "English";
  _m.situacao = SITUACOES[Math.floor(Math.random() * SITUACOES.length)];
  tela.innerHTML = cabecalhoLance() + `
    <p class="importante">${en ? _m.situacao.en : _m.situacao.pt}</p>
    <p>${en ? "What do you want to do?" : "O que você quer fazer?"}</p>
    <button onclick="resolverAtaque('driblar')">${en ? "Dribble" : "Driblar"}</button>
    <button onclick="resolverAtaque('chutar')">${en ? "Shoot" : "Chutar"}</button>
    <button onclick="resolverAtaque('passar')">${en ? "Pass" : "Passar"}</button>
  `;
}

function resolverAtaque(acao) {
  const en = carregar("config") === "English";
  const atrib = { driblar: _m.at.drible, chutar: _m.at.chute, passar: _m.at.passe }[acao];
  let buff = (acao === _m.situacao.fav) ? BUFF_DICA : 0;
  buff += buffDeSkills(acao);

  const gol = ehGol(dado(20), atrib + buff);
  let msg;
  if (!gol) {
    msg = en ? "Not this time!" : "Não foi dessa vez!";
  } else if (acao === "passar") {
    _m.placarJ++; _m.assist++;
    msg = en ? "GOAL! Your assist!" : "GOL! Assistência sua!";
  } else {
    _m.placarJ++; _m.gols++;
    msg = en ? "GOOOAL! What a goal!" : "GOOOL! Que golaço!";
  }
  const extra = buff ? `<p>(+${buff} ${en ? "buff" : "de buff"})</p>` : "";
  tela.innerHTML = cabecalhoLance() + extra + `<p class="importante">${msg}</p>` + botaoProximo();
}

// --- DEFESA (automático) ---
function lanceDefesa() {
  const en = carregar("config") === "English";
  let msg;
  if (dado(20) + _m.at.forca >= LIMIAR_DEFESA) {
    _m.roubos++;
    msg = en ? "The opponent attacks... You won the ball back! Solid defense." : "O adversário ataca... Você recuperou a bola! Defesa segura.";
  } else {
    _m.placarA++;
    msg = en ? "The opponent attacks... Couldn't stop it, they scored." : "O adversário ataca... Não deu, o adversário marcou.";
  }
  tela.innerHTML = cabecalhoLance() + `<p>${msg}</p>` + botaoProximo();
}

// --- CONTRA-ATAQUE (automático, raro) ---
function lanceContra() {
  const en = carregar("config") === "English";
  let msg;
  if (ehGol(dado(20), _m.at.agilidade)) {
    _m.placarJ++; _m.gols++;
    msg = en ? "Lightning counter-attack... GOAL on the break!" : "Contra-ataque relâmpago... GOL no contra-ataque!";
  } else {
    msg = en ? "Lightning counter-attack... the defense recovered in time." : "Contra-ataque relâmpago... a defesa voltou a tempo.";
  }
  tela.innerHTML = cabecalhoLance() + `<p>${msg}</p>` + botaoProximo();
}

// --- EVENTO DE STAT (genérico: usa 1 atributo; funciona pra todos da lista EVENTOS_STAT) ---
function statEventPorId(id) {
  for (const e of EVENTOS_STAT) {
    if (e.id === id) return e;
  }
  return null;
}

function lanceStat(ev) {
  const en = carregar("config") === "English";
  const buff = ev.buff ? buffDeSkills(ev.buff) : 0;
  const atributo = _m.at[ev.atr];

  // "recuperar" usa o limiar de defesa; "gol"/"assist" usam a regra de gol
  let sucesso;
  if (ev.res === "recuperar") {
    sucesso = dado(20) + atributo >= LIMIAR_DEFESA;
  } else {
    sucesso = ehGol(dado(20), atributo + buff);
  }

  let msg;
  if (sucesso) {
    if (ev.res === "gol") { _m.placarJ++; _m.gols++; }
    else if (ev.res === "assist") { _m.placarJ++; _m.assist++; }
    else if (ev.res === "recuperar") { _m.roubos++; }
    msg = en ? ev.ok_en : ev.ok_pt;
  } else {
    msg = en ? ev.no_en : ev.no_pt;
  }

  const extra = buff ? `<p>(+${buff} ${en ? "buff" : "de buff"})</p>` : "";
  tela.innerHTML = cabecalhoLance() +
    `<p>${en ? ev.en : ev.pt}</p>` + extra +
    `<p class="importante">${msg}</p>` + botaoProximo();
}

// --- MOTOR DE ESCOLHA (consequências): mostra opções; cada uma usa um atributo ---
let _escolhaOpcoes = [];

function mostrarEscolha(titulo, opcoes) {
  const en = carregar("config") === "English";
  _escolhaOpcoes = opcoes;
  let botoes = "";
  for (let i = 0; i < opcoes.length; i++) {
    botoes += `<button onclick="resolverEscolha(${i})">${en ? opcoes[i].en : opcoes[i].pt}</button> `;
  }
  tela.innerHTML = cabecalhoLance() + `<p class="importante">${titulo}</p>` + botoes;
}

function resolverEscolha(i) {
  const en = carregar("config") === "English";
  const op = _escolhaOpcoes[i];
  const buff = op.buff ? buffDeSkills(op.buff) : 0;
  const atributo = _m.at[op.atr] + (op.bonus || 0);

  let sucesso;
  if (op.res === "recuperar") sucesso = dado(20) + atributo + buff >= LIMIAR_DEFESA;
  else sucesso = ehGol(dado(20), atributo + buff);

  let msg;
  if (sucesso) {
    if (op.res === "gol") { _m.placarJ++; _m.gols++; }
    else if (op.res === "assist") { _m.placarJ++; _m.assist++; }
    else if (op.res === "recuperar") { _m.roubos++; }
    msg = en ? op.ok_en : op.ok_pt;
  } else {
    msg = en ? op.no_en : op.no_pt;
  }
  tela.innerHTML = cabecalhoLance() + `<p class="importante">${msg}</p>` + botaoProximo();
}

// --- DOMINAR (setup): se dominar, escolhe o que fazer (CONSEQUÊNCIA) ---
function lanceDominar() {
  const en = carregar("config") === "English";
  if (dado(20) + _m.at.drible >= LIMIAR_DEFESA) {
    mostrarEscolha(en ? "You controlled the ball! What now?" : "Dominou a bola! E agora?", [
      { pt: "Chutar", en: "Shoot", atr: "chute", buff: "chutar", res: "gol", ok_pt: "GOL! Que finalização!", ok_en: "GOAL! What a finish!", no_pt: "Pra fora.", no_en: "Wide." },
      { pt: "Passar/Cruzar", en: "Pass/Cross", atr: "passe", buff: "passar", res: "assist", ok_pt: "GOL do time! Assistência sua!", ok_en: "GOAL! Your assist!", no_pt: "Cortado.", no_en: "Cut out." },
      { pt: "Driblar mais", en: "Dribble more", atr: "drible", buff: "driblar", res: "gol", ok_pt: "Driblou e marcou! GOL!", ok_en: "Dribbled and scored! GOAL!", no_pt: "Perdeu a bola.", no_en: "Lost the ball." },
    ]);
  } else {
    tela.innerHTML = cabecalhoLance() +
      `<p>${en ? "The ball drops to you... you couldn't control it." : "A bola sobra pra você... mas não conseguiu dominar."}</p>` +
      botaoProximo();
  }
}

// --- CRUZAMENTO: as SKILLS viram jogadas especiais (só aparecem se você tem a skill) ---
function lanceCruzamento() {
  const en = carregar("config") === "English";
  const opcoes = [
    { pt: "Dominar e chutar", en: "Control and shoot", atr: "chute", buff: "chutar", res: "gol", ok_pt: "GOL! Dominou e finalizou!", ok_en: "GOAL! Controlled and finished!", no_pt: "Isolou a bola.", no_en: "Ballooned it over." },
    { pt: "Passar de primeira", en: "First-time pass", atr: "passe", buff: "passar", res: "assist", ok_pt: "GOL do time! Assistência de primeira!", ok_en: "GOAL! First-time assist!", no_pt: "Errou o passe.", no_en: "Bad pass." },
  ];
  const minhas = carregarSkills();
  if (minhas.includes("bike")) {
    opcoes.push({ pt: "Chutar de BICICLETA! (skill)", en: "BICYCLE KICK! (skill)", atr: "chute", buff: "chutar", res: "gol", bonus: 2, ok_pt: "GOLAÇO DE BICICLETA!! Que coisa linda!", ok_en: "BICYCLE-KICK GOLAZO!! Beautiful!", no_pt: "Tentou a bicicleta e não pegou.", no_en: "Tried the bicycle kick and missed." });
  }
  if (minhas.includes("croqueta")) {
    opcoes.push({ pt: "La Croqueta e chutar (skill)", en: "La Croqueta then shoot (skill)", atr: "drible", buff: "driblar", res: "gol", bonus: 2, ok_pt: "La Croqueta e GOL! Golaço!", ok_en: "La Croqueta and GOAL!", no_pt: "A defesa leu a jogada.", no_en: "The defense read it." });
  }
  mostrarEscolha(en ? "You received a cross in the box! What do you do?" : "Você recebeu um cruzamento na área! O que faz?", opcoes);
}

// --- DISPUTA AÉREA (Força) COM CONSEQUÊNCIA nos dois resultados ---
function lanceDuelo() {
  const en = carregar("config") === "English";
  if (dado(20) + _m.at.forca >= LIMIAR_DEFESA) {
    _m.roubos++;
    // ganhou no alto -> escolhe o que fazer com a cabeçada
    mostrarEscolha(en ? "You win it in the air! What do you do?" : "Você ganha no alto! O que faz?", [
      { pt: "Cabecear a gol", en: "Header on goal", atr: "chute", buff: "chutar", res: "gol", ok_pt: "CABEÇADA NO CANTO! GOL!", ok_en: "HEADER IN THE CORNER! GOAL!", no_pt: "A cabeçada foi pra fora.", no_en: "The header went wide." },
      { pt: "Ajeitar pro companheiro", en: "Head it to a teammate", atr: "passe", buff: "passar", res: "assist", ok_pt: "Ajeitou e saiu o GOL! Assistência!", ok_en: "Laid it off — GOAL! Assist!", no_pt: "Não achou o companheiro.", no_en: "Couldn't find a teammate." },
    ]);
  } else {
    // perdeu -> consequência ruim: o adversário pode marcar
    let msg;
    if (dado(20) >= 12) {
      _m.placarA++;
      msg = en ? "The opponent wins the header and SCORES! Goal against." : "O adversário ganha o cabeceio e MARCA! Gol do adversário.";
    } else {
      msg = en ? "The opponent wins the header, but sends it wide." : "O adversário ganha o cabeceio, mas manda pra fora.";
    }
    tela.innerHTML = cabecalhoLance() +
      `<p>${en ? "Aerial duel! You use your strength..." : "Disputa de bola no alto! Você usa a força..."}</p>` +
      `<p class="importante">${msg}</p>` + botaoProximo();
  }
}

// --- PÊNALTI (épico) ---
function lancePenalti() {
  const en = carregar("config") === "English";
  tela.innerHTML = cabecalhoLance() + `
    <p class="importante">${en ? "PENALTY! (EPIC event!)" : "PÊNALTI! (evento ÉPICO!)"}</p>
    <button onclick="baterPenaltiPartida()">${en ? "Take the penalty" : "Bater o pênalti"}</button>
  `;
}

function baterPenaltiPartida() {
  jogarPenalti(function (resultado) {
    if (resultado === "GOL") { _m.placarJ++; _m.gols++; }
    const en = carregar("config") === "English";
    document.getElementById("penaltiResultado").innerHTML += botaoProximo();
  });
}

// --- FIM DA PARTIDA (carreira + dinheiro + Match XP) ---
function fimPartida() {
  const en = carregar("config") === "English";

  // carreira (aqui o gol conta!)
  const stats = carregarStats();
  adicionar(stats, "Partidas");
  adicionar(stats, "Gols", _m.gols);
  adicionar(stats, "Assistencias", _m.assist);
  adicionar(stats, "Defesas", _m.roubos);
  salvarStats(stats);

  // dinheiro (prêmio)
  let premio = _m.gols * PREMIO_GOL;
  if (_m.placarJ > _m.placarA) premio += PREMIO_VITORIA;
  const total = adicionarDinheiro(premio);

  tela.innerHTML = `
    <h2>${en ? "FULL TIME" : "FIM DE JOGO"}: ${_m.placarJ} x ${_m.placarA}</h2>
    <p>${en ? "Prize" : "Prêmio"}: ${formatar(premio)} (${en ? "money" : "dinheiro"}: ${formatar(total)})</p>
    <div id="matchXpArea"></div>
  `;

  const saldo = _m.placarJ - _m.placarA;
  atribuirMatchXp(calcularMatchXp(_m.gols, _m.roubos, saldo));
}

// Match XP: investir num atributo (requisito: XP necessário >= Match XP)
function atribuirMatchXp(matchXp) {
  const en = carregar("config") === "English";
  const area = document.getElementById("matchXpArea");

  if (matchXp <= 0) {
    area.innerHTML = `<p>${en ? "No Match XP this time." : "Sem Match XP dessa vez."}</p>` + botaoFimPartida();
    return;
  }

  const player = carregarObjeto("player");
  let temElegivel = false;
  let html = `<h3>${en ? `You earned ${matchXp} Match XP!` : `Você ganhou ${matchXp} de Match XP!`}</h3>`;
  html += `<p>${en ? "Where to invest? (required XP must be >= Match XP)" : "Onde investir? (o XP necessário tem que ser >= Match XP)"}</p>`;

  for (const a of todosAtributos()) {
    const nivel = player[a.id] || 0;
    const precisa = xpNecessario(nivel);
    const nome = en ? a.en : a.pt;
    if (precisa >= matchXp) {
      temElegivel = true;
      html += `<p>${nome} (${en ? "needs" : "precisa"} ${precisa}) <button onclick="investirMatchXp('${a.id}', ${matchXp})">${en ? "Invest" : "Investir"}</button></p>`;
    } else {
      html += `<p style="color:#999;">${nome} (${en ? "needs" : "precisa"} ${precisa}) [${en ? "locked" : "bloqueado"}]</p>`;
    }
  }

  if (!temElegivel) {
    area.innerHTML = `<p>${en ? "No attribute can take this Match XP. Lost!" : "Nenhum atributo pode receber esse Match XP. Perdido!"}</p>` + botaoFimPartida();
    return;
  }
  area.innerHTML = html;
}

function investirMatchXp(id, matchXp) {
  const en = carregar("config") === "English";
  const player = carregarObjeto("player");
  const xp = carregarObjeto("xp") || {};
  const r = treinarAtributo(player[id] || 0, xp[id] || 0, matchXp);
  player[id] = r.nivel;
  xp[id] = r.xp;
  salvarObjeto("player", player);
  salvarObjeto("xp", xp);
  tela.innerHTML = `<p class="importante">${en ? `Invested! ${id} is now level ${r.nivel}.` : `Investido! ${id} agora é nível ${r.nivel}.`}</p>` + botaoFimPartida();
}

function botaoFimPartida() {
  const en = carregar("config") === "English";
  return `
    <p>${en ? "Before the next match, you can train (optional):" : "Antes da próxima partida, você pode treinar (opcional):"}</p>
    <button onclick="treinarEntreJogos()">${en ? "Train" : "Treinar"}</button>
    <button onclick="iniciarProximaPartida()">${en ? "Next match" : "Próxima partida"}</button>
    <button onclick="fimPartidaVoltar()">${en ? "Back to menu" : "Voltar ao menu"}</button>
  `;
}

// Treina e, quando o treino acabar, cai direto na próxima partida
function treinarEntreJogos() {
  telaTreino(iniciarProximaPartida);
}

function iniciarProximaPartida() {
  jogarPartida(hub);
}

function fimPartidaVoltar() {
  if (_m.callbackFim) {
    _m.callbackFim(_m.placarJ, _m.placarA);
  } else {
    hub();
  }
}
