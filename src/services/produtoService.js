const { db, admin } = require('../config/firebase');
const { gerarLinkCurto } = require('../utils/linkCurto');
const levenshteinDistance = require('../utils/levenshtein');
const calcularDistancia = require('../utils/calcularDistancia');
const calcularPontuacao = require('../utils/calcularPontuacao');

// Função modificada para aceitar uma lista de produtos e suas quantidades
async function buscarProdutosPorNomes(produtos, cepUsuario) {
  try {
      console.log(`Iniciando busca por múltiplos produtos.`);

      const usersRef = admin.firestore().collection('distribuidores');
      const usersSnapshot = await usersRef.get();

      if (usersSnapshot.empty) {
          console.log('Nenhum distribuidor encontrado');
          return [];
      }

      const resultadosAgrupados = {};  // Para armazenar os resultados agrupados por distribuidor

      // Itera por cada distribuidor
      for (const userDoc of usersSnapshot.docs) {
          const distribuidorData = userDoc.data();
          const userId = userDoc.id;
          console.log(`Buscando produtos para distribuidor: ${userId}`);

          const produtosRef = usersRef.doc(userId).collection('produtos');
          const produtosSnapshot = await produtosRef.get();

          if (produtosSnapshot.empty) {
              console.log(`Nenhum produto encontrado para o distribuidor: ${userId}`);
              continue;
          }

          const distanciaDistribuidor = await calcularDistancia(cepUsuario, distribuidorData.cep);

          let produtosDisponiveis = 0;  // Para calcular o fator de completude
          const totalProdutos = produtos.length;  // Total de produtos requisitados
          let valorTotalOrcamento = 0;  // Soma do valor total dos produtos para esse distribuidor
          let nomesDosProdutos = [];  // Para armazenar os nomes dos produtos para o link

          let produtosDoDistribuidor = [];  // Para armazenar os produtos de cada distribuidor

          // Itera por cada produto da lista que o usuário está buscando
          for (const item of produtos) {
              const nomeProduto = item.nome.toLowerCase();
              const quantidadeDesejada = item.quantidade;

              let produtoEncontrado = false;  // Flag para saber se o produto foi encontrado

              produtosSnapshot.forEach(produtoDoc => {
                  const produtoData = produtoDoc.data();
                  const similaridade = levenshteinDistance(nomeProduto, produtoData.nome.toLowerCase());

                  // Cenário 1: Similaridade perfeita (distância 0)
                  if (similaridade === 0 && produtoData.quantidade >= quantidadeDesejada) {
                      produtosDisponiveis++;  // Contabiliza produto disponível
                      valorTotalOrcamento += produtoData.preco * quantidadeDesejada;  // Soma o valor ao orçamento
                      nomesDosProdutos.push(`${quantidadeDesejada} unidade(s) de ${produtoData.nome}`);  // Adiciona o nome e quantidade ao array
                      produtoEncontrado = true;

                      produtosDoDistribuidor.push({
                          nome: produtoData.nome,
                          precoUnitario: produtoData.preco,
                          quantidadeDisponivel: produtoData.quantidade,
                          quantidadeDesejada: quantidadeDesejada,
                          precoTotal: produtoData.preco * quantidadeDesejada
                      });
                  }

                  // Cenário 2: Similaridade > 3, ignora produto (ou outro filtro rigoroso)
                  if (similaridade > 3) {
                      return;
                  }

                  // Cenário 3: Similaridade entre 1 e 3, aplica filtros mais suaves
                  if (similaridade > 0 && similaridade <= 3 && produtoData.quantidade >= quantidadeDesejada) {
                      produtosDisponiveis++;  // Contabiliza produto disponível
                      valorTotalOrcamento += produtoData.preco * quantidadeDesejada;  // Soma o valor ao orçamento
                      nomesDosProdutos.push(`${quantidadeDesejada} unidade(s) de ${produtoData.nome}`);  // Adiciona o nome e quantidade ao array
                      produtoEncontrado = true;

                      produtosDoDistribuidor.push({
                          nome: produtoData.nome,
                          precoUnitario: produtoData.preco,
                          quantidadeDisponivel: produtoData.quantidade,
                          quantidadeDesejada: quantidadeDesejada,
                          precoTotal: produtoData.preco * quantidadeDesejada
                      });
                  }
              });

              if (!produtoEncontrado) {
                  console.log(`Produto "${nomeProduto}" não encontrado ou não disponível em quantidade suficiente no distribuidor ${distribuidorData.nome_fantasia}.`);
              }
          }

          // Após processar os produtos do distribuidor, verifica se ele tem todos os produtos
          const completude = produtosDisponiveis === totalProdutos;

          // Monta o link geral para o distribuidor
          let mensagem;
          if (produtosDoDistribuidor.length === 1) {
              // Caso seja apenas 1 produto
              const produto = produtosDoDistribuidor[0];
              mensagem = `Olá, vim pela plataforma de orçamentos, gostaria de comprar ${produto.quantidadeDesejada} unidade(s) do produto ${produto.nome} pelo valor de R$${produto.precoTotal}`;
          } else {
              // Caso seja mais de 1 produto
              mensagem = `Olá, vim pela plataforma de orçamentos, gostaria de comprar ${nomesDosProdutos.join(', ')} pelo valor de R$${valorTotalOrcamento}`;
          }

          const longUrl = `https://api.whatsapp.com/send?phone=${distribuidorData.telefone}&text=${encodeURIComponent(mensagem)}`;
          const shortLink = gerarLinkCurto(longUrl);  // Gera o link curto para o distribuidor

          // Calcular a pontuação com base na distância, completude e preço total do orçamento
          const pontuacao = calcularPontuacao(distanciaDistribuidor, completude, valorTotalOrcamento);

          // Agrupa os resultados por distribuidor no formato desejado
          if (produtosDoDistribuidor.length > 0) {
              if (!resultadosAgrupados[distribuidorData.nome_fantasia]) {
                  resultadosAgrupados[distribuidorData.nome_fantasia] = {
                      distribuidor: distribuidorData.nome_fantasia,
                      distancia: distanciaDistribuidor,
                      valorTotalOrcamento: valorTotalOrcamento,
                      temTodosOsProdutos: completude,
                      produtos: produtosDoDistribuidor,
                      pontuacao: pontuacao,  // Adiciona a pontuação calculada
                      link: shortLink  // Adiciona o link único
                  };
              }
          }
      }

      // Converte o objeto em um array para retornar
      const resultados = Object.values(resultadosAgrupados);

      // Ordena os resultados pela pontuação
      resultados.sort((a, b) => b.pontuacao - a.pontuacao);

      return resultados.slice(0, 4);  // Retorna os 4 primeiros resultados mais relevantes
  } catch (error) {
      console.error('Erro ao buscar produtos:', error);
      throw new Error('Erro ao buscar produtos no Firestore');
  }
}
module.exports = { buscarProdutosPorNomes };
