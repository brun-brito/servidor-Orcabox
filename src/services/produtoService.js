const { admin } = require('../config/firebase');
const { gerarLinkCurto } = require('../utils/linkCurto');
const calcularDistancia = require('../utils/calcularDistancia');
const calcularPontuacao = require('../utils/calcularPontuacao');
const produtoMatcher = require('../utils/produtoMatcher');
const normalizarTexto = require('../utils/normalizarTexto');

// Cache para produtos dos distribuidores (renovado a cada 30 minutos)
const cacheDistribuidores = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

async function obterProdutosDistribuidor(userId, forceRefresh = false) {
    const cacheKey = userId;
    const agora = Date.now();
    
    if (!forceRefresh && cacheDistribuidores.has(cacheKey)) {
        const cached = cacheDistribuidores.get(cacheKey);
        if (agora - cached.timestamp < CACHE_TTL) {
            return cached.produtos;
        }
    }

    const usersRef = admin.firestore().collection('distribuidores');
    const produtosRef = usersRef.doc(userId).collection('produtos');
    const produtosSnapshot = await produtosRef.get();
    
    const produtos = [];
    produtosSnapshot.forEach(doc => {
        produtos.push({ id: doc.id, ...doc.data() });
    });

    cacheDistribuidores.set(cacheKey, {
        produtos,
        timestamp: agora
    });

    return produtos;
}

async function buscarProdutosPorNomes(produtos, profissional) {
    try {
        console.log(`Iniciando busca otimizada por múltiplos produtos.`);

        const usersRef = admin.firestore().collection('distribuidores');
        const usersSnapshot = await usersRef.get();

        if (usersSnapshot.empty) {
            console.log('Nenhum distribuidor encontrado');
            return [];
        }

        const resultadosAgrupados = [];

        // Processa distribuidores em paralelo (limitado a 5 simultâneos para não sobrecarregar)
        const distribuidores = usersSnapshot.docs;
        const batchSize = 5;
        
        for (let i = 0; i < distribuidores.length; i += batchSize) {
            const batch = distribuidores.slice(i, i + batchSize);
            const promises = batch.map(userDoc => processarDistribuidor(userDoc, produtos, profissional));
            const resultados = await Promise.all(promises);
            resultadosAgrupados.push(...resultados.filter(r => r !== null));
        }

        const resultadosOrdenados = resultadosAgrupados.sort((a, b) => b.pontuacao - a.pontuacao);

        resultadosOrdenados.forEach((resultado, index) => {
            resultado.orcamento = `Orçamento ${index + 1}`;
        });

        if (resultadosOrdenados.length === 0) {
            console.log('Nenhum produto encontrado.');
            return [{ mensagem: 'Nenhum produto foi encontrado com base nos critérios de busca.' }];
        }

        return resultadosOrdenados.slice(0, 3);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        throw new Error('Erro ao buscar produtos no Firestore');
    }
}

async function processarDistribuidor(userDoc, produtosBuscados, profissional) {
    try {
        const distribuidorData = userDoc.data();
        const userId = userDoc.id;
        
        console.log(`Processando distribuidor: ${distribuidorData.nome_fantasia}`);

        const produtosEstoque = await obterProdutosDistribuidor(userId);
        
        if (produtosEstoque.length === 0) {
            console.log(`Nenhum produto encontrado para: ${distribuidorData.nome_fantasia}`);
            return null;
        }

        // CORREÇÃO: Melhor tratamento de erro na distância
        let distanciaDistribuidor = 1000; // Valor padrão para CEPs inválidos (1000km)
        try {
            const distanciaCalculada = await calcularDistancia(profissional.cep, distribuidorData.cep);
            if (distanciaCalculada && distanciaCalculada !== Infinity && !isNaN(distanciaCalculada)) {
                distanciaDistribuidor = distanciaCalculada;
            } else {
                console.log(`⚠️ Distância inválida para ${distribuidorData.nome_fantasia}, usando valor padrão: ${distanciaDistribuidor}km`);
            }
        } catch (error) {
            console.log(`⚠️ Erro ao calcular distância para ${distribuidorData.nome_fantasia}: ${error.message}, usando valor padrão: ${distanciaDistribuidor}km`);
        }

        let produtosEncontrados = 0;
        let valorTotalOrcamento = 0;
        let nomesDosProdutos = [];
        let produtosDoDistribuidor = [];

        // Busca inteligente para cada produto com validação de qualidade
        for (const item of produtosBuscados) {
            const produtosDisponiveis = produtosEstoque.filter(p => p.quantidade >= item.quantidade);
            
            console.log(`Buscando produto: "${item.nome}" - ${produtosDisponiveis.length} produtos disponíveis`);
            
            const match = produtoMatcher.encontrarMelhorMatch(item.nome, produtosDisponiveis, 0.6);
            
            if (match) {
                console.log(`Match encontrado: "${match.produto.nome}" - Score: ${match.similaridade.toFixed(3)} - Confiança: ${match.confianca} - Compatibilidade: ${match.compatibilidade.toFixed(3)} - SimilaridadeTextual: ${match.similaridadeTextual.toFixed(3)}`);
                
                // CORREÇÃO: Apenas inclui no orçamento se confiança for MEDIA ou superior
                const isQualidadeMinima = match.confianca === 'EXATA' || match.confianca === 'ALTA' || match.confianca === 'MEDIA';
                
                if (isQualidadeMinima) {
                    produtosEncontrados++;
                    
                    const precoTotal = match.produto.preco * item.quantidade;
                    valorTotalOrcamento += precoTotal;
                    nomesDosProdutos.push(`${item.quantidade} unidade(s) de ${match.produto.nome}`);
                    
                    produtosDoDistribuidor.push({
                        nome: match.produto.nome,
                        precoUnitario: match.produto.preco,
                        quantidadeDesejada: item.quantidade,
                        precoTotal: precoTotal,
                        categoria: match.produto.categoria,
                        confiancaMatch: match.confianca,
                        similaridade: match.similaridade,
                        matchAdequado: isQualidadeMinima
                    });
                } else {
                    console.log(`❌ Match rejeitado por baixa confiança: ${match.confianca}`);
                }
            } else {
                console.log(`Nenhum match compatível encontrado para: "${item.nome}"`);
                
                // Debug adicional: mostra alguns produtos disponíveis
                console.log(`Primeiros 5 produtos disponíveis:`, produtosDisponiveis.slice(0, 5).map(p => p.nome));
            }
        }

        if (produtosDoDistribuidor.length === 0) {
            return null;
        }

        const completude = produtosEncontrados === produtosBuscados.length;
        
        // Log para debug
        console.log(`${distribuidorData.nome_fantasia}: ${produtosEncontrados}/${produtosBuscados.length} produtos adequados encontrados. Completude: ${completude}`);
        console.log(`${distribuidorData.nome_fantasia}: Distância=${distanciaDistribuidor}km, Valor=R$${valorTotalOrcamento}`);

        const mensagem = criarMensagemWhatsApp(produtosDoDistribuidor, valorTotalOrcamento);
        const longUrl = `https://api.whatsapp.com/send?phone=${distribuidorData.telefone}&text=${encodeURIComponent(mensagem)}`;
        const shortLink = gerarLinkCurto(longUrl, userId, profissional, nomesDosProdutos.join(', '));
        const pontuacao = calcularPontuacao(distanciaDistribuidor, completude, valorTotalOrcamento);

        console.log(`${distribuidorData.nome_fantasia}: Pontuação final=${pontuacao}`);

        return {
            orcamento: "",
            distancia: distanciaDistribuidor,
            valorTotalOrcamento: valorTotalOrcamento,
            temTodosOsProdutos: completude,
            produtos: produtosDoDistribuidor,
            pontuacao: pontuacao,
            link: shortLink,
            nomeDistribuidor: distribuidorData.nome_fantasia
        };
    } catch (error) {
        console.error(`Erro ao processar distribuidor ${userDoc.id}:`, error);
        return null;
    }
}

function criarMensagemWhatsApp(produtos, valorTotal) {
    if (produtos.length === 1) {
        const produto = produtos[0];
        return `Olá, vim pela plataforma de orçamentos, gostaria de comprar ${produto.quantidadeDesejada} unidade(s) do produto ${produto.nome} pelo valor de R$${produto.precoTotal}`;
    }
    
    const listaProdutos = produtos.map(p => `${p.quantidadeDesejada} unidade(s) de ${p.nome}`).join(', ');
    return `Olá, vim pela plataforma de orçamentos, gostaria de comprar ${listaProdutos} pelo valor de R$${valorTotal}`;
}

module.exports = { buscarProdutosPorNomes };
