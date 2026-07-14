// money.js — conversão do Money.py (dinheiro do jogador, em K/M).
// O saldo fica no localStorage (no lugar do Money.txt).

function carregarDinheiro() {
  const v = parseInt(carregar("money"));
  return isNaN(v) ? 0 : v;
}

function salvarDinheiro(valor) {
  salvar("money", valor);
}

// Ganha dinheiro; devolve o novo total
function adicionarDinheiro(valor) {
  const novo = carregarDinheiro() + valor;
  salvarDinheiro(novo);
  return novo;
}

// Tenta gastar; devolve true se tinha grana, false se não
function gastar(valor) {
  const atual = carregarDinheiro();
  if (atual < valor) {
    return false;
  }
  salvarDinheiro(atual - valor);
  return true;
}

// Tira zeros e ponto sobrando: 2.00 -> "2", 1.50 -> "1.5"
function _limpa(numero) {
  return numero.toFixed(2).replace(/\.?0+$/, "");
}

// Mostra o dinheiro em K (mil) e M (milhão). Ex: 1500000 -> "1.5M", 25000 -> "25K"
function formatar(valor) {
  if (Math.abs(valor) >= 1000000) {
    return _limpa(valor / 1000000) + "M";
  }
  if (Math.abs(valor) >= 1000) {
    return _limpa(valor / 1000) + "K";
  }
  return String(valor);
}
