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
            console.log(`Buscando produtos para distribuidor: ${distribuidorData.nome_fantasia}`);

            const produtosRef = usersRef.doc(userId).collection('produtos');
            const produtosSnapshot = await produtosRef.get();

            if (produtosSnapshot.empty) {
                console.log(`Nenhum produto encontrado para o distribuidor: ${userId}`);
                continue;
            }
            
            const distanciaDistribuidor = await calcularDistancia(cepUsuario, distribuidorData.cep);

            let produtosDisponiveis = 0;  // Para calcular o fator de completude
            let totalProdutosExatos = 0;  // Para contar apenas os produtos que tiveram match exato (cenário 1)
            const totalProdutos = produtos.length;  // Total de produtos requisitados
            let valorTotalOrcamento = 0;  // Soma do valor total dos produtos para esse distribuidor
            let nomesDosProdutos = [];  // Para armazenar os nomes dos produtos para o link

            let produtosDoDistribuidor = [];  // Para armazenar os produtos de cada distribuidor

            // Itera por cada produto da lista que o usuário está buscando
            for (const item of produtos) {
                const nomeProduto = item.nome.toLowerCase().replace(/[^a-z0-9]/g, '');
                const quantidadeDesejada = item.quantidade;

                // Divide o nome do produto buscado em partes
                const partesNomeProduto = nomeProduto.split(' ');

                let produtoEncontrado = false;  // Flag para saber se o produto foi encontrado
                let melhorSimilaridade = Infinity;  // Variável para armazenar a melhor similaridade encontrada
                let melhorProduto;  // Para armazenar o melhor produto encontrado (para cenários 2 e 3)

                produtosSnapshot.forEach(produtoDoc => {
                    const produtoData = produtoDoc.data();
                    const nomeProdutoDataNormalizado = produtoData.nome_lowercase.replace(/[^a-z0-9]/g, '');

                    // console.log(`Comparando: ${nomeProduto} com ${nomeProdutoDataNormalizado}`);
                    const similaridade = levenshteinDistance(nomeProduto, nomeProdutoDataNormalizado);

                    // Cenário 1: Match Perfeito (distância 0)
                    if (similaridade === 0 && produtoData.quantidade >= quantidadeDesejada) {
                        produtosDisponiveis++;  // Contabiliza produto disponível
                        totalProdutosExatos++;  // Contabiliza match exato
                        valorTotalOrcamento += produtoData.preco * quantidadeDesejada;  // Soma o valor ao orçamento
                        nomesDosProdutos.push(`${quantidadeDesejada} unidade(s) de ${produtoData.nome}`);  // Adiciona o nome e quantidade ao array
                        produtoEncontrado = true;

                        produtosDoDistribuidor.push({
                            nome: produtoData.nome,
                            precoUnitario: produtoData.preco,
                            quantidadeDesejada: quantidadeDesejada,
                            precoTotal: produtoData.preco * quantidadeDesejada
                        });
                    }

                    // Cenário 2: Similaridade entre 1 e 3 ou match com uma parte do nome
                    else if (similaridade > 0 && similaridade <= 3 && produtoData.quantidade >= quantidadeDesejada) {
                        if (similaridade < melhorSimilaridade) {
                            melhorSimilaridade = similaridade;
                            melhorProduto = {
                                nome: produtoData.nome,
                                precoUnitario: produtoData.preco,
                                quantidadeDesejada: quantidadeDesejada,
                                precoTotal: produtoData.preco * quantidadeDesejada
                            };
                        }
                    }

                    // Cenário 2 (Split): Se qualquer parte do nome do produto buscado tiver match com o nome do produto do banco
                    else if (partesNomeProduto.some(parte => nomeProdutoDataNormalizado.includes(parte)) && produtoData.quantidade >= quantidadeDesejada) {
                        if (similaridade < melhorSimilaridade) {
                            melhorSimilaridade = similaridade;
                            melhorProduto = {
                                nome: produtoData.nome,
                                precoUnitario: produtoData.preco,
                                quantidadeDesejada: quantidadeDesejada,
                                precoTotal: produtoData.preco * quantidadeDesejada
                            };
                        }
                    }
                });

                // Cenário 3: Produto semelhante encontrado (pelo split ou similaridade)
                if (!produtoEncontrado && melhorProduto) {
                    produtosDisponiveis++;  // Contabiliza produto disponível
                    valorTotalOrcamento += melhorProduto.precoTotal;  // Soma o valor ao orçamento
                    nomesDosProdutos.push(`${quantidadeDesejada} unidade(s) de ${melhorProduto.nome}`);  // Adiciona o nome e quantidade ao array

                    produtosDoDistribuidor.push(melhorProduto);
                    produtoEncontrado = true;
                }

                if (!produtoEncontrado) {
                    console.log(`Produto "${nomeProduto}" não encontrado ou não disponível em quantidade suficiente no distribuidor ${distribuidorData.nome_fantasia}.`);
                }
            }

            // Atualiza o campo "temTodosOsProdutos" apenas se todos os produtos tiverem match exato (cenário 1)
            const completude = totalProdutosExatos === totalProdutos;

            // Monta o link geral para o distribuidor
            let mensagem;
            let buscaRealizada = produtosDoDistribuidor.map(produto => produto.nome).join(', ');
            if (produtosDoDistribuidor.length === 1) {
                // Caso seja apenas 1 produto
                const produto = produtosDoDistribuidor[0];
                mensagem = `Olá, vim pela plataforma de orçamentos, gostaria de comprar ${produto.quantidadeDesejada} unidade(s) do produto ${produto.nome} pelo valor de R$${produto.precoTotal}`;
            } else {
                // Caso seja mais de 1 produto
                mensagem = `Olá, vim pela plataforma de orçamentos, gostaria de comprar ${nomesDosProdutos.join(', ')} pelo valor de R$${valorTotalOrcamento}`;
            }

            const longUrl = `https://api.whatsapp.com/send?phone=${distribuidorData.telefone}&text=${encodeURIComponent(mensagem)}`;
            const idBuscador = await buscarProfissionalPorCep(cepUsuario);
            const shortLink = gerarLinkCurto(longUrl, userId, idBuscador, buscaRealizada);

            // Calcular a pontuação com base na distância, completude e preço total do orçamento
            const pontuacao = calcularPontuacao(distanciaDistribuidor, completude, valorTotalOrcamento);

            // Agrupa os resultados por distribuidor no formato desejado
            if (produtosDoDistribuidor.length > 0) {
                if (!resultadosAgrupados[distribuidorData.nome_fantasia]) {
                    resultadosAgrupados[distribuidorData.nome_fantasia] = {
                        distribuidor: distribuidorData.nome_fantasia,
                        distancia: distanciaDistribuidor,
                        valorTotalOrcamento: valorTotalOrcamento,
                        temTodosOsProdutos: completude,  // Apenas match exato define completude
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

        // Verifica se algum produto foi encontrado, caso contrário retorna uma mensagem de erro
        if (resultados.length === 0) {
            console.log('Nenhum produto encontrado.');
            return [{ mensagem: 'Nenhum produto foi encontrado com base nos critérios de busca.' }];
        }

        return resultados.slice(0, 3);  // Retorna os 3 primeiros resultados mais relevantes
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        throw new Error('Erro ao buscar produtos no Firestore');
    }
}

  

async function buscarProfissionalPorCep(cep) {
    try {
        const usuariosRef = db.collection('profissionais');
        const snapshot = await usuariosRef.get();

        if (snapshot.empty) {
            console.log('Nenhum usuário encontrado.');
            return null;
        }

        let usuarioCorrespondente = null;
        let menorDistancia = Infinity;

        // Itera sobre todos os documentos e calcula a distância de Levenshtein entre o CEP fornecido e o CEP armazenado
        snapshot.forEach(doc => {
            const usuarioData = doc.data();
            const cepBanco = usuarioData.cep;

            // Calcula a distância de Levenshtein entre os CEPs
            const distancia = levenshteinDistance(cep, cepBanco);

            // Define um limite para a similaridade, por exemplo, distância <= 1
            const limiteSimilaridade = 1;

            // Se a distância for menor que o limite e menor que a menor distância registrada, armazena o usuário correspondente
            if (distancia <= limiteSimilaridade && distancia < menorDistancia) {
                menorDistancia = distancia;
                usuarioCorrespondente = usuarioData;
            }
        });

        // Retorna o nome do usuário encontrado ou uma mensagem informando que não encontrou
        if (usuarioCorrespondente) {
            return usuarioCorrespondente;
        } else {
            console.log(`Nenhum usuário encontrado com CEP similar ao fornecido: ${cep}`);
            return null;
        }
    } catch (error) {
        console.error('Erro ao buscar o usuário pelo CEP:', error);
        throw new Error('Erro ao buscar o usuário pelo CEP');
    }
}

module.exports = { buscarProdutosPorNomes };
