const { db, admin } = require('../config/firebase');
const levenshteinDistance = require('../utils/levenshtein');  // Importe o cálculo de Levenshtein

// Função que busca o profissional pelo telefone (com tolerância) e retorna o CEP
async function buscarCepPorTelefone(telefone) {
    try {
        // Busca todos os profissionais
        const profissionaisRef = admin.firestore().collection('profissionais');
        const snapshot = await profissionaisRef.get();

        if (snapshot.empty) {
            console.log('Nenhum profissional encontrado.');
            return null;
        }

        let profissionalCorrespondente = null;
        let menorDistancia = Infinity;  // Inicia com uma distância máxima

        // Itera por todos os documentos e calcula a distância de Levenshtein
        snapshot.forEach(doc => {
            const profissional = doc.data();
            const telefoneBanco = profissional.telefone;

            // Calcula a distância de Levenshtein entre o telefone buscado e o armazenado
            const distancia = levenshteinDistance(telefone, telefoneBanco);

            // Define um limite para considerar telefones próximos (ex: distância <= 2)
            const limiteSimilaridade = 2;

            // Se a distância é menor que o limite e menor que a menor distância registrada, salva o profissional
            if (distancia <= limiteSimilaridade && distancia < menorDistancia) {
                menorDistancia = distancia;
                profissionalCorrespondente = profissional;
            }
        });

        // Verifica se algum profissional correspondente foi encontrado
        if (!profissionalCorrespondente) {
            console.log(`Nenhum profissional encontrado com número similar ao telefone: ${telefone}`);
            return null;
        }

        const cep = profissionalCorrespondente.cep;
        console.log(`Profissional encontrado: ${profissionalCorrespondente.nome}, CEP: ${cep}`);
        return cep;
    } catch (error) {
        console.error('Erro ao buscar o profissional:', error);
        throw new Error('Erro ao buscar o profissional pelo telefone');
    }
}

module.exports = { buscarCepPorTelefone };
