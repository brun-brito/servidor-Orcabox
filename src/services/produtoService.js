const { db, admin } = require('../config/firebase');
const { gerarLinkCurto } = require('./linkCurto');

async function buscarProdutoPorNome(nomeProduto) {
    try {
        console.log(`Iniciando busca por produto com nome: ${nomeProduto}`);
        
        const usersRef = admin.firestore().collection('distribuidores');
        const usersSnapshot = await usersRef.get();

        if (usersSnapshot.empty) {
            console.log('Nenhum distribuidor encontrado');
            return [];  // Retorna array vazio se não encontrar distribuidores
        }

        const resultados = [];

        // Itera por cada usuário/distribuidor
        for (const userDoc of usersSnapshot.docs) {
          const distribuidorData = userDoc.data();
          const userId = userDoc.id;
          console.log(`Buscando produtos para distribuidor: ${userId}`);

          // Referência à subcoleção 'produtos' para o distribuidor atual
          const produtosRef = usersRef.doc(userId).collection('produtos');
          
          // Buscar produtos que tenham o nome igual ao solicitado (case insensitive)
          const produtosSnapshot = await produtosRef
              .where('nome_lowercase', '==', nomeProduto.toLowerCase().trim().replace(/\s+/g, ''))
              .get();

          if (produtosSnapshot.empty) {
              console.log(`Nenhum produto encontrado para o distribuidor: ${userId}`);
              continue;  // Vai para o próximo distribuidor se não encontrar produtos
          }

            // Se encontrar produtos, adiciona aos resultados
            produtosSnapshot.forEach(produtoDoc => {
              const produtoData = produtoDoc.data();
              const longUrl = `https://api.whatsapp.com/send?phone=${distribuidorData.telefone}&text=Ol%C3%A1,%20vim%20pela%20plataforma%20de%20orçamentos,%20gostaria%20de%20comprar%20o%20produto%20${produtoData.nome}%20pelo%20valor%20R$${produtoData.preco}`;
              const shortLink = gerarLinkCurto(longUrl);
              
              resultados.push({
                    distribuidor: distribuidorData.nome_fantasia,
                    link: shortLink, 
                    nome: produtoData.nome,
                    preco: produtoData.preco,
                    quantidade: produtoData.quantidade,
                    descricao: produtoData.descricao,
                    categoria: produtoData.categoria
                });
            });
        }

        console.log(`Busca concluída, ${resultados.length} produtos encontrados.`);
        return resultados;
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        throw new Error('Erro ao buscar produtos no Firestore');
    }
}

module.exports = { buscarProdutoPorNome };
