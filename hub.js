// hub.js — conversão do Hub.py (o menu central do jogo).
// Cada opção chama a tela do sistema; cada tela volta pra cá com "Voltar ao menu".

function hub() {
  const en = carregar("config") === "English";
  tela.innerHTML = `
    <h2>MENU</h2>
    <p><button onclick="jogarPartida(hub)">${en ? "Play a match" : "Jogar partida"}</button></p>
    <p><button onclick="telaTreino()">${en ? "Train" : "Treinar"}</button></p>
    <p><button onclick="lojaSkills()">${en ? "Skills shop" : "Loja de skills"}</button></p>
    <p><button onclick="mostrarStats()">${en ? "Career" : "Carreira"}</button></p>
    <p><button onclick="telaTemporada()">${en ? "Season (league)" : "Temporada (liga)"}</button></p>
    <p><button onclick="telaContinental()">${en ? "Continental cup" : "Copa continental"}</button></p>
    <p><button onclick="telaMercado()">${en ? "Transfer market" : "Mercado"}</button></p>
    <p><button onclick="telaSave()">${en ? "Save / Load" : "Salvar / Carregar"}</button></p>
  `;
}
