const levenshteinDistance = require('./levenshtein');
const normalizarTexto = require('./normalizarTexto');

class ProdutoMatcher {
    constructor() {
        // Categorias semânticas baseadas em uso/aplicação (ordem importa - mais específico primeiro)
        this.categoriasSemânticas = {
            fiosPDO: ['fio', 'pdo', 'thread', 'lifting', 'sustentacao', 'barbed', 'mono', 'screw', 'espiculado'], // CORREÇÃO: Adicionados termos específicos
            agulhas: ['agulha', 'needle', 'canula'],
            toxinas: ['botox', 'xeomin', 'dysport', 'nabota', 'botulinum', 'toxina', 'botulift', 'prosigne', 'relatox'],
            preenchimento: ['juvederm', 'belotero', 'restylane', 'stylage', 'fill', 'hialuronico', 'perfectha', 'subskin'], // CORREÇÃO: Adicionado subskin
            bioestimuladores: ['sculptra', 'radiesse', 'ellanse', 'aesthefill', 'plla'],
            anestésicos: ['lidocaina', 'lido', 'prilocaina', 'articaina'],
            vitaminas: ['profhilo', 'jalupro', 'skinbooster']
        };

        // Termos exclusivos que anulam outras categorias (MELHORIA)
        this.termosExclusivos = {
            fiosPDO: ['fio', 'pdo', 'thread', 'barbed', 'mono', 'screw', 'espiculado'], // CORREÇÃO: Expandido
            agulhas: ['agulha', 'needle', 'canula']
        };

        // Padrões de extração aprimorados
        this.padroes = {
            volume: /(\d+(?:\.\d+)?)\s*(ml|milliliters?|mililitros?)/gi,
            massa: /(\d+(?:\.\d+)?)\s*(mg|miligramas?|milligrams?)/gi,
            unidades: /(\d+(?:\.\d+)?)\s*(ui|iu|unidades?|units?)\b/gi,
            concentracao: /(\d+(?:\.\d+)?)\s*%/gi,
            marca: /(allergan|galderma|merz|ipsen|sinclair|croma|biogelis|rennova|cimed)/gi
        };
    }

    // Extrai características semânticas do produto
    extrairCaracteristicasSemânticas(nomeProduto) {
        const nome = normalizarTexto(nomeProduto);
        const palavras = nome.split(/\s+/).filter(p => p.length > 1);
        
        return {
            nome: nome,
            palavras: palavras,
            categoria: this.identificarCategoria(nome),
            principioAtivo: this.extrairPrincipioAtivo(nome, palavras),
            especificacoes: this.extrairEspecificacoes(nome),
            marca: this.extrairMarca(nome),
            modificadores: this.extrairModificadores(palavras),
            termosPrincipais: this.extrairTermosPrincipais(palavras)
        };
    }

    identificarCategoria(nome) {
        // Primeiro verifica termos exclusivos (fios PDO, agulhas, etc.)
        for (const [categoria, termos] of Object.entries(this.termosExclusivos)) {
            if (termos.some(termo => nome.includes(termo))) {
                return categoria;
            }
        }
        
        // Depois verifica categorias normais
        for (const [categoria, termos] of Object.entries(this.categoriasSemânticas)) {
            if (categoria === 'fiosPDO' || categoria === 'agulhas') continue; // Já verificado acima
            if (termos.some(termo => nome.includes(termo))) {
                return categoria;
            }
        }
        return 'outros';
    }

    extrairPrincipioAtivo(nome, palavras) {
        // CORREÇÃO: Detecção melhorada de fios PDO
        if (nome.includes('fio') || nome.includes('pdo') || nome.includes('thread') || 
            nome.includes('barbed') || nome.includes('mono') || nome.includes('screw') || 
            nome.includes('espiculado')) {
            return 'fio pdo';
        }
        
        if (nome.includes('agulha') || nome.includes('needle') || nome.includes('canula')) {
            return 'agulha';
        }
        
        // Identifica o princípio ativo baseado em padrões conhecidos
        const principiosAtivos = {
            'acido hialuronico': ['hialuronico', 'hyaluronic', 'juvederm', 'belotero', 'restylane', 'perfectha', 'subskin'], // CORREÇÃO: Adicionado subskin
            'toxina botulinica': ['botox', 'xeomin', 'dysport', 'nabota', 'botulinum', 'botulift', 'prosigne', 'relatox'],
            'hidroxiapatita': ['radiesse'],
            'plla': ['sculptra', 'aesthefill', 'plla'],
            'pcl': ['ellanse'],
            'lidocaina': ['lidocaina', 'lido']
        };

        // Para produtos Fill, verifica contexto mais específico
        if (nome.includes('fill')) {
            // Se tem palavras de fio PDO junto, é fio
            if (nome.includes('fio') || nome.includes('pdo') || nome.includes('thread')) {
                return 'fio pdo';
            }
            // Se tem "lido" ou "lidocaina", é Fill com lidocaína específico
            if (nome.includes('lido') || nome.includes('lidocaina')) {
                return 'acido hialuronico fill lido';
            }
            // Se não, provavelmente é ácido hialurônico genérico
            return 'acido hialuronico';
        }

        for (const [principio, termos] of Object.entries(principiosAtivos)) {
            if (termos.some(termo => nome.includes(termo))) {
                return principio;
            }
        }
        return null;
    }

    extrairEspecificacoes(nome) {
        const specs = {};
        
        // Volume
        const matchVolume = nome.match(this.padroes.volume);
        if (matchVolume) {
            specs.volume = parseFloat(matchVolume[0].match(/[\d.]+/)[0]);
        }

        // Massa/Peso
        const matchMassa = nome.match(this.padroes.massa);
        if (matchMassa) {
            specs.massa = parseFloat(matchMassa[0].match(/[\d.]+/)[0]);
        }

        // Unidades
        const matchUnidades = nome.match(this.padroes.unidades);
        if (matchUnidades) {
            specs.unidades = parseFloat(matchUnidades[0].match(/[\d.]+/)[0]);
        }

        // Concentração
        const matchConcentracao = nome.match(this.padroes.concentracao);
        if (matchConcentracao) {
            specs.concentracao = parseFloat(matchConcentracao[0].match(/[\d.]+/)[0]);
        }

        return specs;
    }

    extrairMarca(nome) {
        const match = nome.match(this.padroes.marca);
        return match ? match[0] : null;
    }

    extrairModificadores(palavras) {
        const modificadores = ['intense', 'soft', 'ultra', 'plus', 'balance', 'deep', 'light', 'classic'];
        return palavras.filter(p => modificadores.includes(p));
    }

    extrairTermosPrincipais(palavras) {
        // Remove palavras muito comuns e de especificação
        const stopWords = ['com', 'de', 'para', 'ml', 'mg', 'ui', 'unidades', 'lidocaina', 'lido'];
        const numericPattern = /^\d+(\.\d+)?$/;
        
        return palavras.filter(p => 
            p.length >= 3 && 
            !stopWords.includes(p) && 
            !numericPattern.test(p)
        );
    }

    // Calcula compatibilidade semântica entre dois produtos
    calcularCompatibilidadeSemântica(carac1, carac2) {
        let pontuacao = 0;
        let fatores = 0;

        // 1. Categoria deve ser a mesma (peso alto)
        if (carac1.categoria === carac2.categoria && carac1.categoria !== 'outros') {
            pontuacao += 40; // Bonus para mesma categoria
        } else if (carac1.categoria === 'outros' || carac2.categoria === 'outros') {
            pontuacao += 25; // Produtos não mapeados ainda podem fazer match
        } else if (carac1.categoria !== carac2.categoria) {
            // Verifica incompatibilidades específicas
            const incompatibilidades = {
                'fiosPDO': ['preenchimento', 'toxinas', 'bioestimuladores'],
                'agulhas': ['preenchimento', 'toxinas', 'bioestimuladores', 'fiosPDO'],
                'preenchimento': ['fiosPDO', 'agulhas', 'toxinas'],
                'toxinas': ['preenchimento', 'fiosPDO', 'agulhas', 'bioestimuladores'],
                'bioestimuladores': ['toxinas', 'fiosPDO', 'agulhas']
            };
            
            if (incompatibilidades[carac1.categoria]?.includes(carac2.categoria)) {
                return 0; // Completamente incompatível
            }
        }
        fatores += 40;

        // 2. Princípio ativo deve ser compatível (peso alto)
        if (carac1.principioAtivo && carac2.principioAtivo) {
            if (carac1.principioAtivo === carac2.principioAtivo) {
                pontuacao += 30;
            } else {
                // Incompatibilidades específicas de princípios ativos
                const incomp = [
                    ['fio pdo', 'acido hialuronico'],
                    ['fio pdo', 'toxina botulinica'],
                    ['agulha', 'acido hialuronico'],
                    ['agulha', 'toxina botulinica'],
                    ['acido hialuronico fill lido', 'acido hialuronico']
                ];
                
                const isIncompatible = incomp.some(([p1, p2]) => 
                    (carac1.principioAtivo === p1 && carac2.principioAtivo === p2) ||
                    (carac1.principioAtivo === p2 && carac2.principioAtivo === p1)
                );
                
                if (isIncompatible) {
                    return 0;
                }
            }
        } else {
            // Se um ou ambos não têm princípio ativo identificado, ainda permite match
            pontuacao += 20; // Pontuação padrão para produtos não mapeados
        }
        fatores += 30;

        // 3. Termos principais em comum (MAIS IMPORTANTE para produtos não mapeados)
        const termosComuns = carac1.termosPrincipais.filter(t => 
            carac2.termosPrincipais.includes(t)
        );
        const maxTermos = Math.max(carac1.termosPrincipais.length, carac2.termosPrincipais.length);
        
        if (maxTermos > 0) {
            const proporcaoComum = termosComuns.length / maxTermos;
            pontuacao += proporcaoComum * 20;
        }
        fatores += 20;

        // 4. Marca (peso baixo, mas importante se presente)
        if (carac1.marca && carac2.marca) {
            if (carac1.marca === carac2.marca) {
                pontuacao += 10;
            }
        }
        fatores += 10;

        return pontuacao / fatores;
    }

    // CORREÇÃO CRÍTICA: Melhorar containment e priorização
    calcularSimilaridadeTextual(carac1, carac2) {
        const nomeBase1 = carac1.termosPrincipais.join(' ').toLowerCase();
        const nomeBase2 = carac2.termosPrincipais.join(' ').toLowerCase();
        const nomeCompleto1 = carac1.nome.toLowerCase();
        const nomeCompleto2 = carac2.nome.toLowerCase();
        
        // 1. CORRESPONDÊNCIA EXATA tem prioridade máxima
        if (nomeBase1 === nomeBase2) {
            return 1.0;
        }
        
        // 2. CASO ESPECIAL: Produto genérico vs específico
        // "Juvederm" deve priorizar "Juvederm" sobre "Juvederm Ultra XC"
        if (nomeCompleto2 === nomeCompleto1) {
            return 1.0;
        }
        
        // 3. CONTAINMENT DIRETO: produto buscado dentro do nome completo do estoque
        // "Perfectha" deve encontrar "subskin perfectha 1 seringa"
        if (nomeCompleto2.includes(nomeCompleto1) && nomeCompleto1.length >= 4) {
            // BOOST para produtos mais simples (menos palavras)
            const palavrasEstoque = carac2.termosPrincipais.length;
            const palavrasBuscado = carac1.termosPrincipais.length;
            
            if (palavrasEstoque <= palavrasBuscado + 2) { // Permite até 2 palavras extras
                return 0.98; // Score muito alto para containment simples
            } else {
                return 0.92; // Score alto para containment complexo
            }
        }
        
        // 4. CONTAINMENT POR TERMO: cada termo do produto buscado no nome completo
        for (const termo1 of carac1.termosPrincipais) {
            if (termo1.length >= 4) {
                // Busca exata do termo no nome completo
                const regex = new RegExp(`\\b${termo1}\\b`, 'i');
                if (regex.test(nomeCompleto2)) {
                    return 0.95; // Score muito alto para match de termo exato
                }
                
                // Busca parcial (containment)
                if (nomeCompleto2.includes(termo1)) {
                    return 0.90; // Score alto para containment de termo
                }
            }
        }
        
        // 5. PRIORIZAÇÃO DE PRODUTOS GENÉRICOS
        // Se produto do estoque contém o buscado, prioriza produtos mais simples
        if (nomeBase1.includes(nomeBase2) && nomeBase2.length >= 4) {
            const complexidadeBuscado = carac1.termosPrincipais.length;
            const complexidadeEstoque = carac2.termosPrincipais.length;
            
            // Quanto mais simples o produto do estoque, maior o score
            if (complexidadeEstoque === 1) {
                return 0.96; // Produto de 1 palavra: prioridade máxima
            } else if (complexidadeEstoque <= complexidadeBuscado) {
                return 0.92; // Produto mais simples: alta prioridade
            } else {
                return 0.82; // Produto mais complexo: prioridade menor
            }
        }
        
        // 6. CONTAINMENT ENTRE TERMOS
        let melhorContainment = 0;
        for (const termo1 of carac1.termosPrincipais) {
            for (const termo2 of carac2.termosPrincipais) {
                if (termo1.length >= 3 && termo2.toLowerCase().includes(termo1)) {
                    melhorContainment = Math.max(melhorContainment, 0.88);
                } else if (termo2.length >= 3 && termo1.includes(termo2.toLowerCase())) {
                    melhorContainment = Math.max(melhorContainment, 0.85);
                }
            }
        }
        
        if (melhorContainment > 0) {
            return melhorContainment;
        }

        // 7. CÁLCULO NORMAL (fallback)
        let pontuacao = 0;
        let fatores = 0;

        const sim1 = this.calcularSimilaridadeTermos(carac1.termosPrincipais, carac2.termosPrincipais);
        pontuacao += sim1 * 60;
        fatores += 60;

        const simNome = this.calcularSimilaridadeLevenshtein(carac1.nome, carac2.nome);
        pontuacao += simNome * 25;
        fatores += 25;

        const simSpecs = this.calcularSimilaridadeEspecificacoes(carac1.especificacoes, carac2.especificacoes);
        pontuacao += simSpecs * 15;
        fatores += 15;

        return pontuacao / fatores;
    }

    // Melhora o cálculo de similaridade de termos para dar prioridade ao containment
    calcularSimilaridadeTermos(termos1, termos2) {
        if (termos1.length === 0 && termos2.length === 0) return 1;
        if (termos1.length === 0 || termos2.length === 0) return 0;

        let melhorScore = 0;
        let termosExatos = 0;
        let termosContainment = 0;
        
        for (const termo1 of termos1) {
            let melhorMatchTermo = 0;
            
            for (const termo2 of termos2) {
                // Verifica correspondência exata
                if (termo1 === termo2) {
                    melhorMatchTermo = 1;
                    termosExatos++;
                    break;
                }
                
                // Verifica containment (prioritário)
                if (termo1.length >= 3 && termo2.includes(termo1)) {
                    melhorMatchTermo = Math.max(melhorMatchTermo, 0.9);
                    termosContainment++;
                } else if (termo2.length >= 3 && termo1.includes(termo2)) {
                    melhorMatchTermo = Math.max(melhorMatchTermo, 0.85);
                }
                
                // Similaridade Levenshtein para termos próximos (menor prioridade)
                if (melhorMatchTermo < 0.8) {
                    const distance = levenshteinDistance(termo1, termo2);
                    const maxLen = Math.max(termo1.length, termo2.length);
                    if (distance <= maxLen * 0.25) { // Reduzido de 30% para 25%
                        const simScore = 1 - (distance / maxLen);
                        melhorMatchTermo = Math.max(melhorMatchTermo, simScore * 0.6);
                    }
                }
            }
            
            melhorScore = Math.max(melhorScore, melhorMatchTermo);
        }

        // Boost adicional se há correspondências exatas ou containment
        if (termosExatos > 0) {
            melhorScore = Math.min(1.0, melhorScore * 1.1);
        } else if (termosContainment > 0) {
            melhorScore = Math.min(1.0, melhorScore * 1.05);
        }

        return melhorScore;
    }

    calcularSimilaridadeLevenshtein(texto1, texto2) {
        if (!texto1 || !texto2) return 0;
        const maxLen = Math.max(texto1.length, texto2.length);
        if (maxLen === 0) return 1;
        const distance = levenshteinDistance(texto1, texto2);
        return 1 - (distance / maxLen);
    }

    calcularSimilaridadeEspecificacoes(specs1, specs2) {
        const campos = ['volume', 'massa', 'unidades', 'concentracao'];
        let matches = 0;
        let total = 0;

        for (const campo of campos) {
            if (specs1[campo] !== undefined || specs2[campo] !== undefined) {
                total++;
                if (specs1[campo] !== undefined && specs2[campo] !== undefined) {
                    if (specs1[campo] === specs2[campo]) {
                        matches++;
                    }
                } else {
                    matches += 0.5; // Penalização menor se um não tem a especificação
                }
            }
        }

        return total > 0 ? matches / total : 1;
    }

    // Função principal de matching com limiar mais alto e priorização melhorada
    encontrarMelhorMatch(produtoBuscado, produtosEstoque, limiarCompatibilidade = 0.6) {
        const caracBuscado = this.extrairCaracteristicasSemânticas(produtoBuscado);
        let melhorMatch = null;
        let melhorScore = 0;
        let candidatos = [];

        console.log(`\n🔍 Produto buscado: "${produtoBuscado}"`);
        console.log(`📊 Categoria: ${caracBuscado.categoria} | Princípio: ${caracBuscado.principioAtivo}`);
        console.log(`🏷️  Termos principais: [${caracBuscado.termosPrincipais.join(', ')}]`);

        for (const produto of produtosEstoque) {
            const caracEstoque = this.extrairCaracteristicasSemânticas(produto.nome);
            
            const compatibilidade = this.calcularCompatibilidadeSemântica(caracBuscado, caracEstoque);
            
            if (compatibilidade < limiarCompatibilidade) {
                continue;
            }

            const similaridadeTextual = this.calcularSimilaridadeTextual(caracBuscado, caracEstoque);
            
            let scoreFinal = (compatibilidade * 0.6) + (similaridadeTextual * 0.4);
            
            // CORREÇÃO: Boost mais agressivo para produtos genéricos
            const complexidadeBuscado = caracBuscado.termosPrincipais.length;
            const complexidadeEstoque = caracEstoque.termosPrincipais.length;
            
            // Boost para produtos com complexidade similar ou menor
            if (complexidadeEstoque <= complexidadeBuscado) {
                if (similaridadeTextual >= 0.9) {
                    scoreFinal = Math.min(1.0, scoreFinal * 1.2); // Boost forte
                } else if (similaridadeTextual >= 0.8) {
                    scoreFinal = Math.min(1.0, scoreFinal * 1.15); // Boost médio
                }
            }
            
            // Boost para correspondências muito próximas
            if (similaridadeTextual >= 0.95) {
                scoreFinal = Math.min(1.0, scoreFinal * 1.1);
            }
            
            // CORREÇÃO: Boost para containment direto
            const nomeNormalizado1 = normalizarTexto(produtoBuscado).toLowerCase();
            const nomeNormalizado2 = normalizarTexto(produto.nome).toLowerCase();
            
            if (nomeNormalizado1 === nomeNormalizado2) {
                scoreFinal = 1.0; // Match perfeito
            } else if (nomeNormalizado2.includes(nomeNormalizado1) && nomeNormalizado1.length >= 4) {
                scoreFinal = Math.min(1.0, scoreFinal * 1.15); // Boost para containment
            }
            
            candidatos.push({
                nome: produto.nome,
                score: scoreFinal,
                compatibilidade,
                similaridadeTextual,
                categoria: caracEstoque.categoria,
                principio: caracEstoque.principioAtivo,
                complexidade: complexidadeEstoque,
                termos: caracEstoque.termosPrincipais
            });
            
            if (scoreFinal > melhorScore) {
                melhorScore = scoreFinal;
                melhorMatch = {
                    produto,
                    similaridade: scoreFinal,
                    confianca: this.calcularConfianca(scoreFinal),
                    compatibilidade: compatibilidade,
                    similaridadeTextual: similaridadeTextual
                };
            }
        }

        // Log melhorado com mais detalhes
        const topCandidatos = candidatos
            .sort((a, b) => b.score - a.score)
            .slice(0, 5); // Mostrar top 5 para debug
        
        if (topCandidatos.length > 0) {
            console.log('🏆 Top 5 candidatos:');
            topCandidatos.forEach((c, i) => {
                const match = c.score === melhorScore ? ' ⭐' : '';
                console.log(`  ${i+1}. "${c.nome}" - Score: ${c.score.toFixed(3)} - Termos: [${c.termos.join(', ')}] - Complexidade: ${c.complexidade}${match}`);
            });
        } else {
            console.log('❌ Nenhum candidato encontrado');
        }

        return melhorMatch;
    }

    calcularConfianca(score) {
        if (score >= 0.95) return 'EXATA';
        if (score >= 0.8) return 'ALTA';
        if (score >= 0.65) return 'MEDIA'; // Ajustado
        return 'BAIXA';
    }
}

module.exports = new ProdutoMatcher();
