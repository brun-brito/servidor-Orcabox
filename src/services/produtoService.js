const { db, admin } = require('../config/firebase');
const { gerarLinkCurto } = require('../utils/linkCurto');
const levenshteinDistance = require('../utils/levenshtein');
const calcularDistancia = require('../utils/calcularDistancia');
const calcularPontuacao = require('../utils/calcularPontuacao');

async function buscarProdutoPorNome(nomeProduto) {
    try {
        console.log(`Iniciando busca por produto com nome: ${nomeProduto}`);
        
        const usersRef = admin.firestore().collection('distribuidores');
        const usersSnapshot = await usersRef.get();

        if (usersSnapshot.empty) {
            console.log('Nenhum distribuidor encontrado');
            return [];
        }

        const resultados = [];

        for (const userDoc of usersSnapshot.docs) {
          const distribuidorData = userDoc.data();
          const userId = userDoc.id;
          console.log(`Buscando produtos para distribuidor: ${userId}`);

          const produtosRef = usersRef.doc(userId).collection('produtos');
          const produtosSnapshot = await produtosRef.get();

          if (produtosSnapshot.empty) {
              console.log(`Nenhum produto encontrado para o distribuidor: ${userId}`);
              continue;  // Vai para o próximo distribuidor se não encontrar produtos
          }

          const distanciaDistribuidor = await calcularDistancia('38408204', distribuidorData.cep);
          
          // Faz a comparação com Levenshtein
          produtosSnapshot.forEach(produtoDoc => {
              const produtoData = produtoDoc.data();
              const similaridade = levenshteinDistance(nomeProduto.toLowerCase(), produtoData.nome.toLowerCase());
              const longUrl = `https://api.whatsapp.com/send?phone=${distribuidorData.telefone}&text=Ol%C3%A1,%20vim%20pela%20plataforma%20de%20orçamentos,%20gostaria%20de%20comprar%20o%20produto%20${produtoData.nome}%20pelo%20valor%20R$${produtoData.preco}`;
              const shortLink = gerarLinkCurto(longUrl);
              const pontuacao = calcularPontuacao(similaridade, distanciaDistribuidor);

              if (similaridade <= 5){
                // Adiciona os resultados com pontuação baseada na distância e similaridade
                resultados.push({
                    distribuidor: distribuidorData.nome_fantasia,
                    link: shortLink, 
                    nome: produtoData.nome,
                    preco: produtoData.preco,
                    quantidade: produtoData.quantidade,
                    marca: produtoData.marca,
                    categoria: produtoData.categoria,
                    distancia: distanciaDistribuidor,
                    similaridade: similaridade,
                    pontuacao: pontuacao
                });
              }
          });
        }

        // Ordena os resultados pela maior pontuação (maior relevância)
        resultados.sort((a, b) => b.pontuacao - a.pontuacao);

        // Exibe apenas os 4 primeiros resultados com maior pontuação
        const topResultados = resultados.slice(0, 4);

        // Verifica se algum resultado tem uma similaridade muito baixa e avisa o usuário
        const similaridadeLimite = 5;  // Defina um valor de limite, quanto maior, mais "diferente" o nome
        const aviso = topResultados.some(resultado => resultado.similaridade > similaridadeLimite);

        if (aviso) {
            console.log("Aviso: Algumas correspondências podem não ser exatas, verifique os resultados com atenção.");
        }

        return topResultados;
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        throw new Error('Erro ao buscar produtos no Firestore');
    }
}

module.exports = { buscarProdutoPorNome };