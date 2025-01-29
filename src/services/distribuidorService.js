const { db, admin } = require('../config/firebase');
const levenshteinDistance = require('../utils/levenshtein');
const normalizarTexto = require('../utils/normalizarTexto');

exports.cadastrarProduto = async ({ idDistribuidor, categoria, marca, nome, preco, quantidade }) => {
    try {
        // Gera um ID único para o produto
        const produtoId = db.collection('produtos').doc().id;

        // Cria o documento do produto
        const produtoData = {
            categoria,
            marca,
            nome,
            nome_lowercase: nome.replace(/\s+/g, '').toLowerCase(),
            preco,
            quantidade,
        };

        // Caminho no Firestore
        const produtoRef = db
            .collection('distribuidores')
            .doc(idDistribuidor)
            .collection('produtos')
            .doc(produtoId);

        // Salva o produto no Firestore
        await produtoRef.set(produtoData);

        // Retorna os dados do produto com o ID gerado
        return { id: produtoId, ...produtoData };
    } catch (error) {
        console.error('Erro ao salvar o produto no Firestore:', error);
        throw new Error('Erro ao salvar o produto no Firestore');
    }
};

exports.excluirProduto = async (idDistribuidor, nomeProduto) => {
    try {
        const produtosRef = db
            .collection('distribuidores')
            .doc(idDistribuidor)
            .collection('produtos');

        const snapshot = await produtosRef.get();

        if (snapshot.empty) {
            console.log(`Nenhum produto encontrado para o distribuidor: ${idDistribuidor}`);
            return null;
        }

        let produtoCorrespondente = null;
        let menorDistancia = Infinity;

        snapshot.forEach(doc => {
            const produto = doc.data();
            const nomeBanco = produto.nome_lowercase;

            const distancia = levenshteinDistance(nomeProduto, nomeBanco);
            const limiteSimilaridade = 2;

            if (distancia <= limiteSimilaridade && distancia < menorDistancia) {
                menorDistancia = distancia;

                produtoCorrespondente = {
                    id: doc.id,
                    ...produto,
                };
            }
        });

        if (!produtoCorrespondente) {
            console.log(`Nenhum produto encontrado com nome semelhante ao: ${nomeProduto}`);
            return null;
        }

        // Caminho do produto encontrado
        const produtoRef = produtosRef.doc(produtoCorrespondente.id);
        await produtoRef.delete();

        return produtoCorrespondente;
    } catch (error) {
        console.error('Erro ao excluir o produto no Firestore:', error);
        throw new Error('Erro ao excluir o produto no Firestore');
    }
};

exports.buscarProduto = async (idDistribuidor, nomeProduto) => {
    try {
        const produtosRef = db
            .collection('distribuidores')
            .doc(idDistribuidor)
            .collection('produtos');

        const snapshot = await produtosRef.get();

        if (snapshot.empty) {
            console.log(`Nenhum produto encontrado para o distribuidor: ${idDistribuidor}`);
            return { matchPerfeito: null, proximos: [] };
        }

        let matchPerfeito = null;
        let produtosSimilares = [];

        // Normaliza o nome do produto pesquisado
        const nomePesquisa = normalizarTexto(nomeProduto);

        // Divide o nome em partes para buscar por tokens individuais
        const tokensPesquisa = nomePesquisa.split(/\s+/);

        snapshot.forEach(doc => {
            const produto = doc.data();
            const nomeBanco = normalizarTexto(produto.nome_lowercase);

            // Calcula a distância de Levenshtein entre o nome pesquisado e o nome no banco de dados
            const distancia = levenshteinDistance(nomePesquisa, nomeBanco);

            // Se encontrar um match perfeito (distância 0), retorna imediatamente
            if (distancia === 0) {
                matchPerfeito = {
                    id: doc.id, // ID do produto
                    ...produto,
                };
            } else if (distancia <= 3) {
                // Adiciona à lista de produtos similares com base na distância de Levenshtein
                produtosSimilares.push({
                    id: doc.id,
                    ...produto,
                    distancia,
                });
            } else {
                // Verifica se algum dos tokens do nome pesquisado está presente no nome do produto do banco
                const possuiPalavrasChave = tokensPesquisa.some(token => nomeBanco.includes(token));

                if (possuiPalavrasChave) {
                    produtosSimilares.push({
                        id: doc.id,
                        ...produto,
                        distancia: 4, // Define uma distância maior para indicar um match parcial
                    });
                }
            }
        });

        // Se encontrou um match perfeito, retorna apenas ele
        if (matchPerfeito) {
            return { matchPerfeito, proximos: [] };
        }

        // Ordena os produtos similares pela distância e pega os 3 mais próximos
        produtosSimilares.sort((a, b) => a.distancia - b.distancia);
        const proximos = produtosSimilares.slice(0, 3);

        return { matchPerfeito: null, proximos };
    } catch (error) {
        console.error('Erro ao buscar o produto no Firestore:', error);
        throw new Error('Erro ao buscar o produto no Firestore');
    }
};

exports.editarProduto = async (idDistribuidor, nomeProduto, dadosAtualizados) => {
    try {
        const produtosRef = db
            .collection('distribuidores')
            .doc(idDistribuidor)
            .collection('produtos');

        const snapshot = await produtosRef.get();

        if (snapshot.empty) {
            console.log(`Nenhum produto encontrado para o distribuidor: ${idDistribuidor}`);
            return null;
        }

        let produtoCorrespondente = null;
        let menorDistancia = Infinity;

        snapshot.forEach(doc => {
            const produto = doc.data();
            const nomeBanco = produto.nome;

            const distancia = levenshteinDistance(nomeProduto, nomeBanco);
            const limiteSimilaridade = 2;

            if (distancia <= limiteSimilaridade && distancia < menorDistancia) {
                menorDistancia = distancia;
                produtoCorrespondente = {
                    id: doc.id,
                    ...produto,
                };
            }
        });

        if (!produtoCorrespondente) {
            console.log(`Nenhum produto encontrado com nome semelhante ao: ${nomeProduto}`);
            return null;
        }

        const produtoRef = produtosRef.doc(produtoCorrespondente.id);
        await produtoRef.update(dadosAtualizados);

        // Retorna os dados atualizados do produto
        return { id: produtoCorrespondente.id, ...produtoCorrespondente, ...dadosAtualizados };
    } catch (error) {
        console.error('Erro ao editar o produto no Firestore:', error);
        throw new Error('Erro ao editar o produto no Firestore');
    }
};

exports.consultarFatura = async (idDistribuidor) => {
    try {
        const distribuidorRef = db.collection('distribuidores').doc(idDistribuidor);
        const distribuidorDoc = await distribuidorRef.get();

        if (!distribuidorDoc.exists) {
            console.log(`Distribuidor ${idDistribuidor} não encontrado.`);
            return null;
        }

        const distribuidorData = distribuidorDoc.data();

        const cliques = distribuidorData.cliques || 0;
        const valorFatura = cliques * 5;

        return { cliques, valorFatura };
    } catch (error) {
        console.error("Erro ao buscar a fatura no Firestore:", error);
        throw new Error("Erro ao buscar a fatura no Firestore");
    }
};