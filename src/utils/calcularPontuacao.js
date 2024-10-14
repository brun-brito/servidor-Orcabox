// Função para calcular pontuação com base em distância, completude e preço
function calcularPontuacao(distancia, completude, precoTotal) {
    const pesoDistancia = 0.15;
    const pesoCompletude = 0.5;
    const pesoPreco = 0.35
    // Normalização dos valores para que caibam entre 0 e 1
    const fatorDistancia = 1 / (1 + distancia);  // Quanto menor a distância, maior o fator
    const fatorCompletude = completude ? 1 : 0;  // Completude total = 1, incompleto = 0
    const fatorPreco = 1 / (1 + precoTotal);  // Quanto menor o preço, maior o fator

    // Calcula a pontuação final ponderada
    const pontuacao = (fatorDistancia * pesoDistancia) + 
                      (fatorCompletude * pesoCompletude) + 
                      (fatorPreco * pesoPreco);

    return pontuacao;
}

module.exports = calcularPontuacao;
