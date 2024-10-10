// Função para calcular a pontuação combinando similaridade e distância
function calcularPontuacao(similaridade, distancia, pesoSimilaridade = 0.7, pesoDistancia = 0.3) {
    // Normaliza a similaridade (quanto menor, melhor) e a distância (quanto menor, melhor)
    const fatorSimilaridade = 1 / (1 + similaridade);  // Maior similaridade, maior fator
    const fatorDistancia = 1 / (1 + distancia);  // Menor distância, maior fator

    // Calcula a pontuação final ponderada
    const pontuacao = (fatorSimilaridade * pesoSimilaridade) + (fatorDistancia * pesoDistancia);
    
    return pontuacao;
}

module.exports = calcularPontuacao;
