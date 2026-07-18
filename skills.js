// skills.js — conversão do Skills.py (loja de skills).
// As skills que o jogador tem ficam num array no localStorage (no lugar do Skills.txt).

const CATALOGO = [
  { id: "bike",       pt: "Voleio de Bicicleta", en: "Bike Shoot",     cat: "chutar",  custo: 500000, buff: 3 },
  { id: "distance",   pt: "Chute de Longe",      en: "Distance Shoot", cat: "chutar",  custo: 300000, buff: 2 },
  { id: "crossing",   pt: "Cruzamento",          en: "Crossing",       cat: "passar",  custo: 250000, buff: 2 },
  { id: "killerpass", pt: "Passe Mortal",        en: "Killer Pass",    cat: "passar",  custo: 600000, buff: 3 },
  { id: "croqueta",   pt: "La Croqueta",         en: "La Croqueta",    cat: "driblar", custo: 700000, buff: 3 },
  { id: "elastico",   pt: "Elástico",            en: "Elastico",       cat: "driblar", custo: 400000, buff: 2 },
  // DEFENSIVAS (uma por status de defesa)
  { id: "carrinho",    pt: "Carrinho",    en: "Slide Tackle", cat: "desarme",     custo: 400000, buff: 3 },
  { id: "antecipacao", pt: "Antecipação", en: "Anticipation", cat: "interceptar", custo: 400000, buff: 3 },
  { id: "muralha",     pt: "Muralha",     en: "Wall",         cat: "cabeceio",    custo: 300000, buff: 2 },
  { id: "impulsao",    pt: "Impulsão",    en: "Leap",         cat: "salto",       custo: 300000, buff: 2 },
];

// rótulo da ação na tela (PT, EN)
const CAT_LABEL = {
  chutar: ["Chute", "Shot"],
  passar: ["Passe", "Pass"],
  driblar: ["Drible", "Dribble"],
  desarme: ["Desarme", "Tackle"],
  interceptar: ["Interceptação", "Interception"],
  cabeceio: ["Cabeceio", "Heading"],
  salto: ["Salto", "Jumping"],
};

function carregarSkills() {
  return carregarObjeto("skills") || [];
}

function salvarSkills(minhas) {
  salvarObjeto("skills", minhas);
}

// Acha uma skill pelo id (loop, sem função de seta pra ficar simples)
function skillPorId(id) {
  for (const s of CATALOGO) {
    if (s.id === id) {
      return s;
    }
  }
  return null;
}

// Soma o buff das skills que o jogador tem naquela ação (chutar/passar/driblar)
function buffDeSkills(categoria) {
  const minhas = carregarSkills();
  let total = 0;
  for (const s of CATALOGO) {
    if (minhas.includes(s.id) && s.cat === categoria) {
      total += s.buff;
    }
  }
  return total;
}

// Mostra a loja (bilíngue)
function lojaSkills() {
  const en = carregar("config") === "English";
  const minhas = carregarSkills();

  let html = `<h2>${en ? "SKILLS SHOP" : "LOJA DE SKILLS"}</h2>`;
  html += `<p>${en ? "Money" : "Dinheiro"}: ${formatar(carregarDinheiro())}</p>`;

  for (const s of CATALOGO) {
    const nome = en ? s.en : s.pt;
    const acao = CAT_LABEL[s.cat][en ? 1 : 0];
    if (minhas.includes(s.id)) {
      html += `<p>${nome} [${acao} +${s.buff}] - ${en ? "owned" : "comprada"}</p>`;
    } else {
      html += `<p>${nome} [${acao} +${s.buff}] - ${formatar(s.custo)}
        <button onclick="comprarSkill('${s.id}')">${en ? "Buy" : "Comprar"}</button></p>`;
    }
  }

  html += `<div id="skillsMsg" class="importante"></div>`;
  html += `<button onclick="hub()">${en ? "Back to menu" : "Voltar ao menu"}</button>`;
  tela.innerHTML = html;
}

// Roda ao clicar em Comprar
function comprarSkill(id) {
  const en = carregar("config") === "English";
  const minhas = carregarSkills();
  if (minhas.includes(id)) {
    return;
  }
  const skill = skillPorId(id);
  if (gastar(skill.custo)) {
    minhas.push(id);
    salvarSkills(minhas);
    lojaSkills(); // redesenha a loja (dinheiro menor, skill comprada)
  } else {
    document.getElementById("skillsMsg").textContent =
      en ? "Not enough money!" : "Dinheiro insuficiente!";
  }
}
