const levenshteinDistance = require('./levenshtein');
const normalizarTexto = require('./normalizarTexto');

class ProdutoMatcher {
    constructor() {
        // Categorias semânticas baseadas em uso/aplicação (ordem importa - mais específico primeiro)
        this.categoriasSemânticas = {
            fiosPDO: ['fio', 'pdo', 'thread', 'lifting', 'sustentacao', 'barbed', 'mono', 'screw', 'espiculado'], // CORREÇÃO: Adicionados termos específicos
            fiosSustentacao: ['silhouette'], // NOVO: Categoria específica para fios de sustentação
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
            fiosSustentacao: ['silhouette'], // NOVO: Silhouette é exclusivo
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
            termosPrincipais: palavras, // CORREÇÃO: Usar palavras com espaços preservados
            marcaPrincipal: this.extrairMarcaPrincipal(palavras) // NOVO: detecta marca principal
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
        
        // NOVO: Detecção de fios Silhouette
        if (nome.includes('silhouette')) {
            return 'fio silhouette';
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
            'lidocaina': ['lidocaina', 'lido'],
            'fio silhouette': ['silhouette'] // NOVO: Princípio ativo específico para Silhouette
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

    // NOVO: Extrai marca principal com validação de palavra completa
    extrairMarcaPrincipal(palavras) {
        const marcasEspecificas = {
            'perfectha': 'perfectha',
            'juvederm': 'juvederm', 
            'belotero': 'belotero',
            'restylane': 'restylane',
            'radiesse': 'radiesse',
            'sculptra': 'sculptra',
            'botox': 'botox',
            'xeomin': 'xeomin',
            'dysport': 'dysport',
            'stylage': 'stylage',
            'ellanse': 'ellanse',
            'silhouette': 'silhouette' // NOVO: Adicionado Silhouette como marca
        };
        
        for (const palavra of palavras) {
            if (marcasEspecificas[palavra]) {
                return marcasEspecificas[palavra];
            }
        }
        return null;
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
            // NOVO: Compatibilidade entre categorias relacionadas
            const categoriasCompativeis = {
                'fiosPDO': ['fiosSustentacao'], // Fios PDO são compatíveis com fios de sustentação
                'fiosSustentacao': ['fiosPDO'], // E vice-versa
            };
            
            if (categoriasCompativeis[carac1.categoria]?.includes(carac2.categoria)) {
                pontuacao += 35; // Compatibilidade alta para categorias relacionadas
            } else {
                // Verifica incompatibilidades específicas
                const incompatibilidades = {
                    'fiosPDO': ['preenchimento', 'toxinas', 'bioestimuladores'],
                    'fiosSustentacao': ['preenchimento', 'toxinas', 'bioestimuladores'], // NOVO: Incompatibilidades do Silhouette
                    'agulhas': ['preenchimento', 'toxinas', 'bioestimuladores', 'fiosPDO', 'fiosSustentacao'],
                    'preenchimento': ['fiosPDO', 'agulhas', 'toxinas', 'fiosSustentacao'],
                    'toxinas': ['preenchimento', 'fiosPDO', 'agulhas', 'bioestimuladores', 'fiosSustentacao'],
                    'bioestimuladores': ['toxinas', 'fiosPDO', 'agulhas', 'fiosSustentacao']
                };
                
                if (incompatibilidades[carac1.categoria]?.includes(carac2.categoria)) {
                    return 0; // Completamente incompatível
                }
            }
        }
        fatores += 40;

        // 2. Princípio ativo deve ser compatível (peso alto)
        if (carac1.principioAtivo && carac2.principioAtivo) {
            if (carac1.principioAtivo === carac2.principioAtivo) {
                pontuacao += 30;
            } else {
                // NOVO: Compatibilidade entre princípios relacionados
                const principiosCompativeis = {
                    'fio pdo': ['fio silhouette'], // Fios PDO são compatíveis com fios Silhouette
                    'fio silhouette': ['fio pdo'], // E vice-versa
                };
                
                if (principiosCompativeis[carac1.principioAtivo]?.includes(carac2.principioAtivo)) {
                    pontuacao += 25; // Compatibilidade boa para princípios relacionados
                } else {
                    // Incompatibilidades específicas de princípios ativos
                    const incomp = [
                        ['fio pdo', 'acido hialuronico'],
                        ['fio pdo', 'toxina botulinica'],
                        ['fio silhouette', 'acido hialuronico'], // NOVO: Incompatibilidades do Silhouette
                        ['fio silhouette', 'toxina botulinica'],
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
            
            // NOVO: Bonus extra se o termo principal (marca) está presente
            if (termosComuns.length > 0) {
                const temMarcaComum = termosComuns.some(termo => 
                    ['silhouette', 'perfectha', 'juvederm', 'belotero', 'restylane', 'ellanse'].includes(termo)
                );
                if (temMarcaComum) {
                    pontuacao += 5; // Bonus pequeno para marca em comum
                }
            }
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

    // NOVO: Verifica se uma marca está presente como palavra completa
    verificarMarcaCompleta(nomeProduto, marca) {
        const regex = new RegExp(`\\b${marca}\\b`, 'i');
        return regex.test(nomeProduto);
    }

    // CORREÇÃO CRÍTICA: Melhorar similaridade textual com foco em marcas
    calcularSimilaridadeTextual(carac1, carac2) {
        const nomeCompleto1 = carac1.nome.toLowerCase();
        const nomeCompleto2 = carac2.nome.toLowerCase();
        
        // 1. CORRESPONDÊNCIA EXATA tem prioridade máxima
        if (nomeCompleto1 === nomeCompleto2) {
            return 1.0;
        }
        
        // 2. VERIFICAÇÃO DE INCOMPATIBILIDADE DE MARCAS
        if (carac1.marcaPrincipal && carac2.marcaPrincipal && 
            carac1.marcaPrincipal !== carac2.marcaPrincipal) {
            // Marcas diferentes são incompatíveis - penalização severa
            console.log(`❌ Marcas incompatíveis: ${carac1.marcaPrincipal} vs ${carac2.marcaPrincipal}`);
            return 0.1; // Score muito baixo para marcas diferentes
        }
        
        // 3. PRIORIDADE MÁXIMA: MESMA MARCA
        if (carac1.marcaPrincipal && carac2.marcaPrincipal && 
            carac1.marcaPrincipal === carac2.marcaPrincipal) {
            
            console.log(`✅ Mesma marca encontrada: ${carac1.marcaPrincipal}`);
            
            // Para produtos da mesma marca, score muito alto
            const palavras1 = carac1.termosPrincipais;
            const palavras2 = carac2.termosPrincipais;
            
            // Se o produto buscado tem só a marca ou marca + 1 modificador
            if (palavras1.length <= 2) {
                return 0.95; // Score muito alto para busca genérica da marca
            }
            
            // Calcula similaridade dos modificadores (excluindo a marca)
            const modificadores1 = palavras1.filter(p => p !== carac1.marcaPrincipal);
            const modificadores2 = palavras2.filter(p => p !== carac1.marcaPrincipal);
            
            if (modificadores1.length === 0) {
                return 0.90; // Busca só pela marca
            }
            
            const similaridadeModificadores = this.calcularSimilaridadeTermos(modificadores1, modificadores2);
            return 0.80 + (similaridadeModificadores * 0.15); // Base alta + bonus por modificadores
        }
        
        // 4. UMA MARCA IDENTIFICADA: verifica containment da marca
        if (carac1.marcaPrincipal && this.verificarMarcaCompleta(nomeCompleto2, carac1.marcaPrincipal)) {
            console.log(`✅ Marca ${carac1.marcaPrincipal} encontrada no produto do estoque`);
            return 0.85; // Score alto para containment de marca
        }
        
        if (carac2.marcaPrincipal && this.verificarMarcaCompleta(nomeCompleto1, carac2.marcaPrincipal)) {
            console.log(`✅ Marca ${carac2.marcaPrincipal} encontrada no produto buscado`);
            return 0.85;
        }
        
        // 5. CONTAINMENT DIRETO (sem confusão de marcas)
        if (nomeCompleto2.includes(nomeCompleto1) && nomeCompleto1.length >= 4) {
            // Verifica se não há conflito de marcas
            if (!this.temConflitoDeMarcas(carac1, carac2)) {
                return 0.80;
            }
        }
        
        // 6. CONTAINMENT POR TERMOS (com validação de marcas)
        for (const termo1 of carac1.termosPrincipais) {
            if (termo1.length >= 4) {
                const regex = new RegExp(`\\b${termo1}\\b`, 'i');
                if (regex.test(nomeCompleto2) && !this.temConflitoDeMarcas(carac1, carac2)) {
                    return 0.75;
                }
            }
        }
        
        // 7. CÁLCULO PADRÃO (se não há conflitos de marca)
        if (!this.temConflitoDeMarcas(carac1, carac2)) {
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
        
        // 8. FALLBACK: Score muito baixo para evitar matches incorretos
        return 0.1;
    }

    // NOVO: Detecta conflitos de marcas
    temConflitoDeMarcas(carac1, carac2) {
        // Se ambos têm marcas identificadas e são diferentes
        if (carac1.marcaPrincipal && carac2.marcaPrincipal && 
            carac1.marcaPrincipal !== carac2.marcaPrincipal) {
            return true;
        }
        
        // Se um tem marca identificada e o outro contém uma marca diferente
        const marcasConhecidas = ['perfectha', 'juvederm', 'belotero', 'restylane', 'radiesse', 'sculptra', 'botox', 'xeomin', 'dysport', 'silhouette']; // NOVO: Adicionado silhouette
        
        if (carac1.marcaPrincipal) {
            for (const marca of marcasConhecidas) {
                if (marca !== carac1.marcaPrincipal && this.verificarMarcaCompleta(carac2.nome, marca)) {
                    return true;
                }
            }
        }
        
        if (carac2.marcaPrincipal) {
            for (const marca of marcasConhecidas) {
                if (marca !== carac2.marcaPrincipal && this.verificarMarcaCompleta(carac1.nome, marca)) {
                    return true;
                }
            }
        }
        
        return false;
    }

    // Melhora o cálculo de similaridade de termos
    calcularSimilaridadeTermos(termos1, termos2) {
        if (termos1.length === 0 && termos2.length === 0) return 1;
        if (termos1.length === 0 || termos2.length === 0) return 0;

        let melhorScore = 0;
        let termosExatos = 0;
        
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
                } else if (termo2.length >= 3 && termo1.includes(termo2)) {
                    melhorMatchTermo = Math.max(melhorMatchTermo, 0.85);
                }
                
                // Similaridade Levenshtein para termos próximos (menor prioridade)
                if (melhorMatchTermo < 0.7) {
                    const distance = levenshteinDistance(termo1, termo2);
                    const maxLen = Math.max(termo1.length, termo2.length);
                    if (distance <= maxLen * 0.3) {
                        const simScore = 1 - (distance / maxLen);
                        melhorMatchTermo = Math.max(melhorMatchTermo, simScore * 0.6);
                    }
                }
            }
            
            melhorScore = Math.max(melhorScore, melhorMatchTermo);
        }

        // Boost para correspondências exatas
        if (termosExatos > 0) {
            melhorScore = Math.min(1.0, melhorScore * 1.1);
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

    // Função principal de matching com validação de marcas
    encontrarMelhorMatch(produtoBuscado, produtosEstoque, limiarCompatibilidade = 0.6) {
        const caracBuscado = this.extrairCaracteristicasSemânticas(produtoBuscado);
        let melhorMatch = null;
        let melhorScore = 0;
        let candidatos = [];

        console.log(`\n🔍 Produto buscado: "${produtoBuscado}"`);
        console.log(`📊 Categoria: ${caracBuscado.categoria} | Princípio: ${caracBuscado.principioAtivo} | Marca: ${caracBuscado.marcaPrincipal}`);
        console.log(`🏷️  Termos principais: [${caracBuscado.termosPrincipais.join(', ')}]`);

        for (const produto of produtosEstoque) {
            const caracEstoque = this.extrairCaracteristicasSemânticas(produto.nome);
            
            const compatibilidade = this.calcularCompatibilidadeSemântica(caracBuscado, caracEstoque);
            
            if (compatibilidade < limiarCompatibilidade) {
                continue;
            }

            const similaridadeTextual = this.calcularSimilaridadeTextual(caracBuscado, caracEstoque);
            
            let scoreFinal = (compatibilidade * 0.5) + (similaridadeTextual * 0.5); // CORREÇÃO: Mais peso na similaridade textual
            
            // BOOST para mesma marca
            if (caracBuscado.marcaPrincipal && caracEstoque.marcaPrincipal && 
                caracBuscado.marcaPrincipal === caracEstoque.marcaPrincipal) {
                scoreFinal = Math.min(1.0, scoreFinal * 1.3); // Boost de 30% para mesma marca
            }
            
            // PENALIZAÇÃO para marcas diferentes
            if (caracBuscado.marcaPrincipal && caracEstoque.marcaPrincipal && 
                caracBuscado.marcaPrincipal !== caracEstoque.marcaPrincipal) {
                scoreFinal *= 0.3; // Penalização severa para marcas diferentes
            }
            
            candidatos.push({
                nome: produto.nome,
                score: scoreFinal,
                compatibilidade,
                similaridadeTextual,
                categoria: caracEstoque.categoria,
                principio: caracEstoque.principioAtivo,
                complexidade: caracEstoque.termosPrincipais.length,
                termos: caracEstoque.termosPrincipais,
                marca: caracEstoque.marcaPrincipal
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
            .slice(0, 5);
        
        if (topCandidatos.length > 0) {
            console.log('🏆 Top 5 candidatos:');
            topCandidatos.forEach((c, i) => {
                const match = c.score === melhorScore ? ' ⭐' : '';
                const marcaInfo = c.marca ? `Marca: ${c.marca}` : 'Marca: N/A';
                console.log(`  ${i+1}. "${c.nome}" - Score: ${c.score.toFixed(3)} - ${marcaInfo} - Termos: [${c.termos.join(', ')}]${match}`);
            });
        } else {
            console.log('❌ Nenhum candidato encontrado');
        }

        return melhorMatch;
    }

    calcularConfianca(score) {
        if (score >= 0.90) return 'EXATA';  // CORREÇÃO: Limiar mais alto para EXATA
        if (score >= 0.75) return 'ALTA';   // CORREÇÃO: Mantido
        if (score >= 0.60) return 'MEDIA';  // CORREÇÃO: Mantido
        return 'BAIXA';
    }
}

module.exports = new ProdutoMatcher();
