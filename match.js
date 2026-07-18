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

// Eventos de STAT AUTOMÁTICOS (só os de Chute/Passe/Drible, que o Gomes pediu pra não mexer).
// res: "gol" (marca), "assist" (gol do time + assistência). rar = raridade (comum/raro/epico).
const EVENTOS_STAT = [
  // DRIBLE
  { id: "drible1", atr: "drible", buff: "driblar", res: "gol", rar: "comum",
    pt: "Você encara o marcador no 1x1...", en: "You take on your marker 1-on-1...",
    ok_pt: "Driblou e finalizou! GOL!", ok_en: "Dribbled past and scored! GOAL!", no_pt: "Perdeu a bola no drible.", no_en: "Lost the ball on the dribble." },
  { id: "drible2", atr: "drible", buff: "driblar", res: "gol", rar: "epico",
    pt: "Você tenta um drible ousado na área...", en: "You try a bold dribble in the box...",
    ok_pt: "Que jogada! GOL!", ok_en: "What a move! GOAL!", no_pt: "A defesa cortou.", no_en: "The defense cut it out." },
  // CHUTE (shoot)
  { id: "falta", atr: "chute", buff: "chutar", res: "gol", rar: "comum",
    pt: "Falta perigosa! Você cobra...", en: "Dangerous free kick! You take it...",
    ok_pt: "GOOOL! No ângulo!", ok_en: "GOOOAL! Top corner!", no_pt: "Por cima do gol!", no_en: "Over the bar!" },
  { id: "chutefora", atr: "chute", buff: "chutar", res: "gol", rar: "raro",
    pt: "Chute de fora da área!", en: "Long shot from outside the box!",
    ok_pt: "MÍSSIL! GOL de longe!", ok_en: "ROCKET! Goal from distance!", no_pt: "Pra fora.", no_en: "Wide." },
  // PASSE (pass)
  { id: "passe1", atr: "passe", buff: "passar", res: "assist", rar: "comum",
    pt: "Lançamento longo pro companheiro...", en: "Long ball to your teammate...",
    ok_pt: "Passe perfeito, GOL do time! Assistência sua!", ok_en: "Perfect pass, GOAL! Your assist!", no_pt: "Interceptado.", no_en: "Intercepted." },
  { id: "passe2", atr: "passe", buff: "passar", res: "assist", rar: "raro",
    pt: "Tabela rápida na entrada da área...", en: "Quick one-two at the edge of the box...",
    ok_pt: "Tabelou e saiu o GOL! Assistência sua!", ok_en: "One-two and GOAL! Your assist!", no_pt: "O passe não chegou.", no_en: "The pass didn't get there." },

  // ===== DEFENSIVOS (CB): 1º evento de cada status (automático, "recuperar") =====
  { id: "salto1", atr: "salto", buff: "salto", res: "recuperar", rar: "comum", tipo: "def",
    pt: "Bola alçada na área! Você sobe pra afastar...", en: "Ball lofted into the box! You rise to clear it...",
    ok_pt: "Subiu mais que todos e afastou o perigo!", ok_en: "Out-jumped everyone and cleared it!", no_pt: "Não alcançou — sobra pro atacante.", no_en: "Didn't reach it — falls to the striker." },
  { id: "cabeceio1", atr: "cabeceio", buff: "cabeceio", res: "recuperar", rar: "comum", tipo: "def",
    pt: "Cruzamento perigoso! Você antecipa de cabeça...", en: "Dangerous cross! You get your head to it first...",
    ok_pt: "Testaço firme, afastou pra longe!", ok_en: "Firm header, cleared it away!", no_pt: "A cabeçada foi fraca e sobrou.", no_en: "Weak header, it dropped loose." },
  { id: "desarme1", atr: "desarme", buff: "desarme", res: "recuperar", rar: "comum", tipo: "def", falta: "normal",
    pt: "O atacante avança driblando. Você dá o bote...", en: "The striker dribbles at you. You go for the tackle...",
    ok_pt: "Desarme limpo! Recuperou a bola.", ok_en: "Clean tackle! Won the ball.", no_pt: "Ele passou por você.", no_en: "He got past you." },
  { id: "interceptacao1", atr: "interceptacao", buff: "interceptar", res: "recuperar", rar: "comum", tipo: "def",
    pt: "O adversário prepara o lançamento. Você lê a jogada...", en: "The opponent lines up a through ball. You read it...",
    ok_pt: "Leu tudo e interceptou o passe!", ok_en: "Read it perfectly and intercepted!", no_pt: "O passe passou reto.", no_en: "The pass slipped through." },
];

// Eventos COM ESCOLHA por atributo ("Você [situação], o que quer fazer?").
// Cada opção usa um atributo (res: gol / assist / recuperar). Reusa o mostrarEscolha.
const EVENTOS_ESCOLHA = [
  // CONDUÇÃO DE BOLA
  { id: "conducao1", rar: "comum", pt: "Você recebe cercado por dois marcadores. O que faz?", en: "You receive surrounded by two defenders. What do you do?", opcoes: [
    { pt: "Proteger e girar (condução)", en: "Shield and turn (control)", atr: "conducao", res: "recuperar", ok_pt: "Você protege com categoria e mantém a bola!", ok_en: "You shield it with class and keep the ball!", no_pt: "Perdeu no aperto.", no_en: "Lost it under pressure." },
    { pt: "Arriscar o passe", en: "Risk the pass", atr: "passe", buff: "passar", res: "assist", ok_pt: "Passe entre as pernas — GOL! Assistência!", ok_en: "Pass through the legs — GOAL! Assist!", no_pt: "Interceptado.", no_en: "Intercepted." },
    { pt: "Sair driblando", en: "Dribble out", atr: "drible", buff: "driblar", res: "gol", ok_pt: "Driblou os dois e marcou! GOL!", ok_en: "Beat both and scored! GOAL!", no_pt: "Travado.", no_en: "Blocked." },
  ] },
  { id: "conducao2", rar: "raro", pt: "A bola chega em velocidade. Você domina...", en: "The ball comes in fast. You control it...", opcoes: [
    { pt: "Domínio orientado pro gol (condução)", en: "First touch towards goal (control)", atr: "conducao", res: "gol", ok_pt: "Domínio perfeito e finalização! GOL!", ok_en: "Perfect touch and finish! GOAL!", no_pt: "A bola escapou.", no_en: "The ball got away." },
    { pt: "Amortecer pro companheiro", en: "Cushion it to a teammate", atr: "passe", buff: "passar", res: "assist", ok_pt: "Ajeitou e GOL do time! Assistência!", ok_en: "Laid it off — GOAL! Assist!", no_pt: "Passe fraco.", no_en: "Weak pass." },
  ] },
  // FORÇA
  { id: "forca1", rar: "comum", pt: "Dividida forte no meio-campo. O que faz?", en: "A strong challenge in midfield. What do you do?", opcoes: [
    { pt: "Meter o corpo (força)", en: "Use your body (strength)", atr: "forca", res: "recuperar", ok_pt: "Você ganha no corpo e recupera a bola!", ok_en: "You win the physical battle and recover!", no_pt: "Levou a pior.", no_en: "Came off worse." },
    { pt: "Sair jogando rápido", en: "Play it quick", atr: "passe", buff: "passar", res: "assist", ok_pt: "Tocou rápido e GOL! Assistência!", ok_en: "Quick pass — GOAL! Assist!", no_pt: "Errou o toque.", no_en: "Misplaced it." },
  ] },
  { id: "forca2", rar: "epico", pt: "Você segura o zagueiro nas costas. Como finaliza?", en: "You hold the defender off. How do you finish?", opcoes: [
    { pt: "Empurrar e chutar (força)", en: "Power past and shoot (strength)", atr: "forca", res: "gol", ok_pt: "Empurrou o zagueiro e marcou! GOL!", ok_en: "Powered past and scored! GOAL!", no_pt: "O zagueiro aguentou.", no_en: "The defender held firm." },
    { pt: "Chutar de primeira", en: "Shoot first-time", atr: "chute", buff: "chutar", res: "gol", ok_pt: "GOL! Que chute!", ok_en: "GOAL! What a strike!", no_pt: "Pra fora.", no_en: "Wide." },
  ] },
  // AGILIDADE
  { id: "agil1", rar: "raro", pt: "Espaço nas costas da defesa! Você arranca...", en: "Space behind the defense! You sprint...", opcoes: [
    { pt: "Explodir na velocidade (agilidade)", en: "Burst with pace (agility)", atr: "agilidade", res: "gol", ok_pt: "Deixou todo mundo pra trás! GOL!", ok_en: "Left everyone behind! GOAL!", no_pt: "A defesa recuperou.", no_en: "The defense recovered." },
    { pt: "Rolar pro companheiro", en: "Square it to a teammate", atr: "passe", buff: "passar", res: "assist", ok_pt: "Rolou e GOL! Assistência!", ok_en: "Squared it — GOAL! Assist!", no_pt: "Não achou ninguém.", no_en: "No one there." },
  ] },
  { id: "agil2", rar: "epico", pt: "O zagueiro vem pra cima. O que faz?", en: "The defender rushes in. What do you do?", opcoes: [
    { pt: "Mudança de direção rápida (agilidade)", en: "Quick change of direction (agility)", atr: "agilidade", res: "gol", ok_pt: "Mudou de direção e marcou! GOL!", ok_en: "Changed direction and scored! GOAL!", no_pt: "Escorregou.", no_en: "Slipped." },
    { pt: "Proteger e segurar", en: "Shield and hold", atr: "forca", res: "recuperar", ok_pt: "Segurou firme e manteve a posse!", ok_en: "Held firm and kept possession!", no_pt: "Perdeu a bola.", no_en: "Lost the ball." },
  ] },
  // EQUILÍBRIO
  { id: "equilibrio1", rar: "comum", pt: "O zagueiro te dá um encontrão. Você se equilibra e...", en: "The defender shoulders you. You steady yourself and...", opcoes: [
    { pt: "Firmar o corpo e chutar (equilíbrio)", en: "Steady and shoot (balance)", atr: "equilibrio", res: "gol", ok_pt: "Não caiu e finalizou! GOL!", ok_en: "Stayed on your feet and scored! GOAL!", no_pt: "Desequilibrou e isolou.", no_en: "Off balance, missed." },
    { pt: "Cair dando um toque pro companheiro — passar", en: "Play on and pass", atr: "passe", buff: "passar", res: "assist", ok_pt: "Seguiu firme e deu GOL! Assistência!", ok_en: "Stayed up and set up a GOAL! Assist!", no_pt: "Passe atrapalhado.", no_en: "Clumsy pass." },
  ] },
  { id: "equilibrio2", rar: "epico", pt: "Você quase cai, mas se recupera no último instante...", en: "You nearly fall, but recover at the last second...", opcoes: [
    { pt: "Malabarismo e finalização (equilíbrio)", en: "Acrobatic finish (balance)", atr: "equilibrio", res: "gol", ok_pt: "Finalização acrobática — GOLAÇO!", ok_en: "Acrobatic finish — GOLAZO!", no_pt: "Não alcançou a bola.", no_en: "Couldn't reach it." },
    { pt: "Proteger a bola no chão", en: "Protect the ball", atr: "equilibrio", res: "recuperar", ok_pt: "Se firmou e manteve a posse!", ok_en: "Steadied and kept possession!", no_pt: "Caiu e perdeu.", no_en: "Fell and lost it." },
  ] },
  // FÔLEGO
  { id: "folego1", rar: "raro", pt: "Fim de jogo, todos cansados. Você ainda tem gás...", en: "Late in the game, everyone's tired. You still have energy...", opcoes: [
    { pt: "Arrancar no sprint (fôlego)", en: "Burst in a sprint (stamina)", atr: "folego", res: "gol", ok_pt: "Correu mais que todos e marcou! GOL!", ok_en: "Outran everyone and scored! GOAL!", no_pt: "As pernas pesaram.", no_en: "Legs gave out." },
    { pt: "Pressionar e roubar (fôlego)", en: "Press and win it back (stamina)", atr: "folego", res: "recuperar", ok_pt: "Pressão implacável, recuperou a bola!", ok_en: "Relentless press, won the ball!", no_pt: "Sem fôlego pra chegar.", no_en: "Too tired to get there." },
  ] },
  { id: "folego2", rar: "epico", pt: "Contra-ataque longo, corrida do campo todo...", en: "A long counter, running the whole pitch...", opcoes: [
    { pt: "Correr até o fim e finalizar (fôlego)", en: "Run all the way and finish (stamina)", atr: "folego", res: "gol", ok_pt: "Correu 60 metros e marcou! GOLAÇO!", ok_en: "Ran 60 metres and scored! GOLAZO!", no_pt: "Chegou sem forças.", no_en: "Arrived exhausted." },
    { pt: "Tocar pro companheiro fresco", en: "Pass to a fresher teammate", atr: "passe", buff: "passar", res: "assist", ok_pt: "Tocou e GOL do time! Assistência!", ok_en: "Passed and GOAL! Assist!", no_pt: "Passe fraco de cansaço.", no_en: "Tired, weak pass." },
  ] },

  // ===== DEFENSIVOS (CB): 2º evento de cada status (com escolha) =====
  // SALTO
  { id: "salto2", rar: "raro", tipo: "def", pt: "Escanteio contra! A bola vem na área.", en: "Corner against you! The ball comes into the box.", opcoes: [
    { pt: "Subir e afastar de cabeça (Salto)", en: "Jump and clear (Jumping)", atr: "salto", buff: "salto", res: "recuperar", ok_pt: "Subiu bonito e tirou o perigo!", ok_en: "Great leap, cleared the danger!", no_pt: "Não subiu a tempo.", no_en: "Didn't get up in time." },
    { pt: "Ajeitar de cabeça e sair jogando (Interceptação)", en: "Head it out to start a move (Interception)", atr: "interceptacao", buff: "interceptar", res: "recuperar", ok_pt: "Ajeitou de cabeça e a defesa saiu jogando!", ok_en: "Headed it out and started the play!", no_pt: "A bola ficou viva na área.", no_en: "The ball stayed alive in the box." },
  ] },
  // CABECEIO
  { id: "cabeceio2", rar: "raro", tipo: "def", pt: "Escanteio A FAVOR! Você sobe na área adversária.", en: "Corner FOR you! You go up in their box.", opcoes: [
    { pt: "Cabecear com força a gol (Cabeceio)", en: "Powerful header on goal (Heading)", atr: "cabeceio", buff: "cabeceio", res: "gol", ok_pt: "CABEÇADA NO CANTO — QUE GOLAÇO!", ok_en: "HEADER IN THE CORNER — WHAT A GOAL!", no_pt: "Cabeceou por cima.", no_en: "Headed it over." },
    { pt: "Ajeitar de cabeça pro companheiro (Cabeceio)", en: "Head it down to a teammate (Heading)", atr: "cabeceio", buff: "cabeceio", res: "assist", ok_pt: "Escorou e saiu o GOL! Assistência!", ok_en: "Flicked it on — GOAL! Assist!", no_pt: "Ninguém alcançou.", no_en: "No one got to it." },
  ] },
  // DESARME
  { id: "desarme2", rar: "raro", tipo: "def", pt: "Contra-ataque adversário e VOCÊ é o último homem!", en: "Counter-attack and YOU are the last man!", opcoes: [
    { pt: "Partir pro carrinho (Desarme)", en: "Go for the slide tackle (Tackle)", atr: "desarme", buff: "desarme", res: "recuperar", falta: "ultimo", ok_pt: "CARRINHO PERFEITO! Salvou o time!", ok_en: "PERFECT SLIDE! Saved the team!", no_pt: "Chegou atrasado no carrinho.", no_en: "Late on the tackle." },
    { pt: "Segurar e atrasar esperando a defesa (Interceptação)", en: "Hold and delay for cover (Interception)", atr: "interceptacao", buff: "interceptar", res: "recuperar", ok_pt: "Segurou com inteligência até a defesa voltar!", ok_en: "Smartly delayed until help arrived!", no_pt: "Ele te venceu na corrida.", no_en: "He beat you for pace." },
  ] },
  // INTERCEPTAÇÃO
  { id: "interceptacao2", rar: "raro", tipo: "def", pt: "Passe rasteiro cortando a defesa. Você antecipa...", en: "A low pass splitting the defense. You anticipate...", opcoes: [
    { pt: "Cortar e segurar a posse (Interceptação)", en: "Cut it out and keep possession (Interception)", atr: "interceptacao", buff: "interceptar", res: "recuperar", ok_pt: "Interceptou e manteve a bola!", ok_en: "Intercepted and kept the ball!", no_pt: "Não chegou na bola.", no_en: "Couldn't reach it." },
    { pt: "Cortar e lançar no contra-ataque (Passe)", en: "Intercept and launch a counter (Pass)", atr: "passe", buff: "passar", res: "assist", ok_pt: "Roubou e lançou — GOL no contra! Assistência!", ok_en: "Won it and launched — counter GOAL! Assist!", no_pt: "O lançamento saiu errado.", no_en: "The pass went astray." },
  ] },
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
  // lê TODOS os atributos (antes faltavam condução/equilíbrio/fôlego — os eventos deles sempre falhavam!)
  const at = {};
  for (const a of todosAtributos()) at[a.id] = parseInt(p[a.id]) || 0;
  return at;
}

let _m = null; // estado da partida

// Quantos lances a SUA partida tem = força do seu time (5 pequeno / 8 médio / 12 grande)
function lancesDaPartida() {
  return (typeof chancesDoTime === "function") ? chancesDoTime(carregar("team")) : N_LANCES;
}

// Em que lance o cansaço começa (quanto maior a partida, mais tarde ele bate)
function inicioCansaco(nLances) {
  if (nLances >= 12) return 6; // time grande (12 lances)
  if (nLances >= 8) return 4;  // time médio (8 lances)
  return 3;                    // time pequeno (5 lances)
}

// Cansaço no lance atual, JÁ descontando o Fôlego. Retorna >= 0 (pra SUBTRAIR do lance).
// Acumula -1 por lance a partir do início; cada ponto de Fôlego cancela 1 de cansaço.
function cansacoAtual() {
  if (!_m) return 0;
  const inicio = inicioCansaco(_m.nLances);
  if (_m.lance < inicio) return 0;
  const bruto = _m.lance - inicio + 1;          // -1, -2, -3... até o fim da partida
  return Math.max(0, bruto - (_m.folego || 0)); // Fôlego segura o cansaço
}

// Linha que mostra o buff (+) e o cansaço (-) do lance
function linhaBuffCansaco(buff) {
  const en = carregar("config") === "English";
  const c = cansacoAtual();
  let s = "";
  if (buff) s += `<p>(+${buff} ${en ? "buff" : "de buff"})</p>`;
  if (c > 0) s += `<p>(-${c} ${en ? "fatigue (raise Stamina!)" : "de cansaço (treine Fôlego!)"})</p>`;
  return s;
}

// Classifica cada lance-base como ofensivo/defensivo/neutro (pra pesar por posição)
const TIPO_LANCE = { ataque: "of", defense: "def", contra: "of", duelo: "def", dominar: "of", cruzamento: "of", penalty: "neu" };

// Quantas cópias do lance entram no sorteio, conforme a posição.
// CB (zagueiro): MUITO mais defesa, MUITO menos ataque. (CDM entra depois.)
function fatorPosicao(tipo, posicao) {
  if (posicao === "CB") {          // zagueiro: MUITO defensivo
    if (tipo === "def") return 3;
    if (tipo === "of") return 0.3;
  }
  if (posicao === "CDM") {         // volante: defensivo, mas ainda participa do ataque
    if (tipo === "def") return 2;
    if (tipo === "of") return 0.6;
  }
  if (posicao === "Lateral") {     // lateral: defende o corredor e ainda sobe pra atacar (dois lados)
    if (tipo === "def") return 1.3;
  }
  if (posicao === "MC") {          // meia central: o motor equilibrado do time (box-to-box)
    if (tipo === "def") return 1.1;
  }
  // atacantes (CF, CAM, LW, RW): pouca defesa, foco no ataque
  if (tipo === "def") return 0.5;
  return 1;
}

// Começa a partida. callbackFim(placarJ, placarA) roda no fim.
// tipoJogo: "amistoso" (padrão, oferece treino/próxima) ou "liga" (volta pra classificação).
function jogarPartida(callbackFim, tipoJogo) {
  const pos = (carregarObjeto("player") || {}).posicao || "";
  const sorteio = [];
  for (const par of EVENTOS_M) {
    const copias = Math.round(COPIAS_M[par[1]] * fatorPosicao(TIPO_LANCE[par[0]] || "neu", pos));
    for (let i = 0; i < copias; i++) sorteio.push(par[0]);
  }
  // eventos de atributo entram conforme a raridade (comum > raro > épico) e a posição
  const pesoRar = { comum: 3, raro: 2, epico: 1 };
  for (const ev of EVENTOS_STAT.concat(EVENTOS_ESCOLHA)) {
    const copias = Math.round(pesoRar[ev.rar] * fatorPosicao(ev.tipo || "of", pos));
    for (let i = 0; i < copias; i++) sorteio.push(ev.id);
  }
  _m = {
    lance: 1, placarJ: 0, placarA: 0, gols: 0, assist: 0, roubos: 0,
    at: lerAtributosMatch(), sorteio: sorteio, callbackFim: callbackFim || null,
    tipoJogo: tipoJogo || "amistoso", situacao: null,
    nLances: lancesDaPartida(),
    amarelos: 0, vermelho: false, expulso: false,
  };
  _m.folego = _m.at.folego || 0; // Fôlego alivia o cansaço da reta final
  proximoLance();
}

function cabecalhoLance() {
  const en = carregar("config") === "English";
  const cartoes = _m.vermelho ? "  🟥" : (_m.amarelos ? "  " + "🟨".repeat(_m.amarelos) : "");
  return `<p><b>[${en ? "Play" : "Lance"} ${_m.lance}/${_m.nLances}] — ${_m.placarJ} x ${_m.placarA}${cartoes}</b></p>`;
}

function proximoLance() {
  if (_m.lance > _m.nLances) return fimPartida();
  const tipo = _m.sorteio[Math.floor(Math.random() * _m.sorteio.length)];
  if (tipo === "ataque") lanceAtaque();
  else if (tipo === "defense") lanceDefesa();
  else if (tipo === "contra") lanceContra();
  else if (tipo === "duelo") lanceDuelo();
  else if (tipo === "dominar") lanceDominar();
  else if (tipo === "cruzamento") lanceCruzamento();
  else if (tipo === "penalty") lancePenalti();
  else {
    // eventos com escolha (novos) ou eventos de stat automáticos (antigos)
    const evEsc = escolhaEventoPorId(tipo);
    if (evEsc) lanceEscolhaEvento(evEsc);
    else lanceStat(statEventPorId(tipo));
  }
}

function avancarLance() {
  _m.lance++;
  proximoLance();
}

function botaoProximo() {
  const en = carregar("config") === "English";
  return `<button onclick="avancarLance()">${en ? "Next" : "Próximo"}</button>`;
}

// Depois de uma falta: se foi expulso, a partida acaba na hora; senão, segue o jogo
function botaoAposFalta() {
  const en = carregar("config") === "English";
  if (_m.expulso) return `<button onclick="fimPartida()">${en ? "End (sent off)" : "Fim de jogo (expulso)"}</button>`;
  return botaoProximo();
}

// Resolve uma falta cometida num desarme errado. tipo: "normal" ou "ultimo" (último homem = vermelho direto).
// Aplica cartão e o tiro livre/pênalti do adversário. Devolve o HTML pra mostrar.
function resolverFalta(tipo) {
  const en = carregar("config") === "English";
  let html = "";

  // --- Cartão ---
  if (tipo === "ultimo") {
    _m.vermelho = true; _m.expulso = true;
    html += `<p class="importante">🟥 ${en ? "STRAIGHT RED! Last-man foul — you're SENT OFF!" : "VERMELHO DIRETO! Falta de último homem — você foi EXPULSO!"}</p>`;
  } else if (dado(3) <= 2) { // falta dura ~66% vira amarelo
    _m.amarelos++;
    if (_m.amarelos >= 2) {
      _m.vermelho = true; _m.expulso = true;
      html += `<p class="importante">🟨🟨 ${en ? "Second yellow — RED CARD! You're sent off!" : "Segundo amarelo — VERMELHO! Você foi expulso!"}</p>`;
    } else {
      html += `<p class="importante">🟨 ${en ? "YELLOW CARD! Careful now." : "CARTÃO AMARELO! Agora é perigo."}</p>`;
    }
  } else {
    html += `<p>${en ? "Hard foul, but no card." : "Falta dura, mas o juiz não deu cartão."}</p>`;
  }

  // --- Local da falta: pênalti (na área) ou tiro livre ---
  const naArea = dado(10) <= (tipo === "ultimo" ? 4 : 3); // ~40% / ~30% de ser na área
  if (naArea) {
    html += `<p>${en ? "Foul in the box... PENALTY to the opponent!" : "Falta na área... PÊNALTI pro adversário!"}</p>`;
    if (dado(10) <= 8) { _m.placarA++; html += `<p class="importante">${en ? "The opponent scores the penalty." : "O adversário converte o pênalti."}</p>`; }
    else html += `<p class="importante">${en ? "The keeper SAVES the penalty!" : "O goleiro DEFENDE o pênalti!"}</p>`;
  } else {
    html += `<p>${en ? "Free kick to the opponent..." : "Tiro livre pro adversário..."}</p>`;
    if (dado(20) >= 16) { _m.placarA++; html += `<p class="importante">${en ? "GOAL from the free kick!" : "GOL de falta!"}</p>`; }
    else html += `<p>${en ? "The wall clears it." : "A barreira afasta a falta."}</p>`;
  }
  return html;
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
  const cansaco = cansacoAtual();

  const gol = ehGol(dado(20), atrib + buff - cansaco);
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
  const extra = linhaBuffCansaco(buff);
  tela.innerHTML = cabecalhoLance() + extra + `<p class="importante">${msg}</p>` + botaoProximo();
}

// --- DEFESA (automático) ---
function lanceDefesa() {
  const en = carregar("config") === "English";
  let msg;
  if (dado(20) + _m.at.desarme - cansacoAtual() >= LIMIAR_DEFESA) {
    _m.roubos++;
    msg = en ? "The opponent attacks... You won the ball back! Solid defense." : "O adversário ataca... Você recuperou a bola! Defesa segura.";
  } else {
    _m.placarA++;
    msg = en ? "The opponent attacks... Couldn't stop it, they scored." : "O adversário ataca... Não deu, o adversário marcou.";
  }
  tela.innerHTML = cabecalhoLance() + `<p>${msg}</p>` + linhaBuffCansaco(0) + botaoProximo();
}

// --- CONTRA-ATAQUE (automático, raro) ---
function lanceContra() {
  const en = carregar("config") === "English";
  let msg;
  if (ehGol(dado(20), _m.at.agilidade - cansacoAtual())) {
    _m.placarJ++; _m.gols++;
    msg = en ? "Lightning counter-attack... GOAL on the break!" : "Contra-ataque relâmpago... GOL no contra-ataque!";
  } else {
    msg = en ? "Lightning counter-attack... the defense recovered in time." : "Contra-ataque relâmpago... a defesa voltou a tempo.";
  }
  tela.innerHTML = cabecalhoLance() + `<p>${msg}</p>` + linhaBuffCansaco(0) + botaoProximo();
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
  const cansaco = cansacoAtual();

  // "recuperar" usa o limiar de defesa; "gol"/"assist" usam a regra de gol
  let sucesso;
  if (ev.res === "recuperar") {
    sucesso = dado(20) + atributo + buff - cansaco >= LIMIAR_DEFESA;
  } else {
    sucesso = ehGol(dado(20), atributo + buff - cansaco);
  }

  let msg, faltaHtml = "";
  if (sucesso) {
    if (ev.res === "gol") { _m.placarJ++; _m.gols++; }
    else if (ev.res === "assist") { _m.placarJ++; _m.assist++; }
    else if (ev.res === "recuperar") { _m.roubos++; }
    msg = en ? ev.ok_en : ev.ok_pt;
  } else {
    msg = en ? ev.no_en : ev.no_pt;
    if (ev.falta && dado(10) <= 3) faltaHtml = resolverFalta(ev.falta); // errou o desarme -> ~30% de virar falta
  }

  const extra = linhaBuffCansaco(buff);
  tela.innerHTML = cabecalhoLance() +
    `<p>${en ? ev.en : ev.pt}</p>` + extra +
    `<p class="importante">${msg}</p>` + faltaHtml + (faltaHtml ? botaoAposFalta() : botaoProximo());
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
  const cansaco = cansacoAtual();

  let sucesso;
  if (op.res === "recuperar") sucesso = dado(20) + atributo + buff - cansaco >= LIMIAR_DEFESA;
  else sucesso = ehGol(dado(20), atributo + buff - cansaco);

  let msg, faltaHtml = "";
  if (sucesso) {
    if (op.res === "gol") { _m.placarJ++; _m.gols++; }
    else if (op.res === "assist") { _m.placarJ++; _m.assist++; }
    else if (op.res === "recuperar") { _m.roubos++; }
    msg = en ? op.ok_en : op.ok_pt;
  } else {
    msg = en ? op.no_en : op.no_pt;
    if (op.falta === "ultimo") {
      // carrinho de último homem: errar é quase sempre desastre (vermelho ou gol tomado)
      if (dado(10) <= 7) faltaHtml = resolverFalta("ultimo");
      else { _m.placarA++; faltaHtml = `<p class="importante">${en ? "He beat you and SCORED!" : "Ele te passou e MARCOU!"}</p>`; }
    } else if (op.falta && dado(10) <= 3) {
      faltaHtml = resolverFalta(op.falta);
    }
  }
  tela.innerHTML = cabecalhoLance() + linhaBuffCansaco(buff) + `<p class="importante">${msg}</p>` + faltaHtml + (faltaHtml ? botaoAposFalta() : botaoProximo());
}

// --- EVENTO COM ESCOLHA por atributo (usa a lista EVENTOS_ESCOLHA) ---
function escolhaEventoPorId(id) {
  for (const e of EVENTOS_ESCOLHA) {
    if (e.id === id) return e;
  }
  return null;
}

function lanceEscolhaEvento(ev) {
  const en = carregar("config") === "English";
  mostrarEscolha(en ? ev.en : ev.pt, ev.opcoes);
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
  if (dado(20) + _m.at.salto >= LIMIAR_DEFESA) {
    _m.roubos++;
    // ganhou no alto (Salto) -> escolhe o que fazer com a cabeçada (Cabeceio)
    mostrarEscolha(en ? "You win it in the air! What do you do?" : "Você ganha no alto! O que faz?", [
      { pt: "Cabecear a gol", en: "Header on goal", atr: "cabeceio", res: "gol", ok_pt: "CABEÇADA NO CANTO! GOL!", ok_en: "HEADER IN THE CORNER! GOAL!", no_pt: "A cabeçada foi pra fora.", no_en: "The header went wide." },
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

  if (_m.expulso) salvar("suspenso", "1"); // cartão vermelho -> suspenso na próxima partida da liga

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
  // Partida de LIGA: volta direto pra classificação (o callback aplica o resultado)
  if (_m.tipoJogo === "liga") {
    return `<button onclick="fimPartidaVoltar()">${en ? "See standings" : "Ver a classificação"}</button>`;
  }
  // Partida amistosa: oferece treinar / próxima / voltar
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
