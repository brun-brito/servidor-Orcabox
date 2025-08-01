const axios = require('axios');

async function calcularDistancia(cepUsuario, cepDistribuidor) {
    // const API_KEY = 'AIzaSyCTr-yK-bgmrpJ-X21GYuvAxIQoAS7ynmQ';
    const API_KEY = 'AIzaSyCXo798ytk7Gs53WAIv0cjr-3ooeVHuw18';
    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${cepUsuario}&destination=${cepDistribuidor}&key=${API_KEY}&mode=driving`;
    try {
        const response = await axios.get(url);

        // Verifica se a rota e as informações de distância estão disponíveis
        if (response.data.routes && response.data.routes.length > 0 && response.data.routes[0].legs && response.data.routes[0].legs.length > 0) {
            const distanciaMetros = response.data.routes[0].legs[0].distance.value;  // Distância total em metros
            const distanciaKm = distanciaMetros / 1000;  // Convertendo para quilômetros
            return distanciaKm;
        } else {
            console.error('Dados de rota inválidos ou rota não encontrada.');
            return Infinity;  // Retorna um valor alto se não encontrar uma rota válida
        }
    } catch (error) {
        console.error('Erro ao calcular distância:', error);
        return Infinity;  // Em caso de erro, retorna um valor alto indicando falha na obtenção da distância
    }
}

module.exports = calcularDistancia;