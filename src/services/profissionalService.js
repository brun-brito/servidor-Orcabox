const { db, admin } = require('../config/firebase');
const levenshteinDistance = require('../utils/levenshtein');  // Importe o cálculo de Levenshtein

// Função que busca o profissional pelo telefone (com tolerância) e retorna o CEP
async function buscarDadosPorTelefone(telefone, isDistribuidor = false) {
    try {
        // Define a coleção com base no parâmetro isDistribuidor
        const colecao = isDistribuidor ? 'distribuidores' : 'profissionais';
        const usuariosRef = admin.firestore().collection(colecao);
        const snapshot = await usuariosRef.get();

        if (snapshot.empty) {
            console.log(`Nenhum usuário encontrado na coleção ${colecao}.`);
            return null;
        }

        let usuarioCorrespondente = null;
        let menorDistancia = Infinity; // Inicia com uma distância máxima

        // Itera por todos os documentos e calcula a distância de Levenshtein
        snapshot.forEach(doc => {
            const usuario = doc.data();
            const telefoneBanco = usuario.telefone;

            // Calcula a distância de Levenshtein entre o telefone buscado e o armazenado
            const distancia = levenshteinDistance(telefone, telefoneBanco);

            // Define um limite para considerar telefones próximos (ex: distância <= 2)
            const limiteSimilaridade = 1;

            // Se a distância é menor que o limite e menor que a menor distância registrada, salva o usuário
            if (distancia <= limiteSimilaridade && distancia < menorDistancia) {
                menorDistancia = distancia;
                usuarioCorrespondente = {
                    id: doc.id,
                    ...usuario,
                };
            }
        });

        // Verifica se algum usuário correspondente foi encontrado
        if (!usuarioCorrespondente) {
            console.log(`Nenhum usuário encontrado com número similar ao telefone: ${telefone}`);
            return null;
        }

        // Retorna todos os dados do usuário correspondente
        return usuarioCorrespondente;
    } catch (error) {
        console.error('Erro ao buscar o usuário:', error);
        throw new Error('Erro ao buscar o usuário pelo telefone');
    }
}

module.exports = { buscarDadosPorTelefone };
