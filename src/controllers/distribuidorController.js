const distribuidorService = require('../services/distribuidorService');

exports.cadastrarProduto = async (req, res) => {
    const { idDistribuidor, categoria, marca, nome, preco, quantidade } = req.body;

    // Verifica se todos os campos obrigatórios foram enviados
    if (!categoria || !marca || !nome || !preco || !quantidade) {
        return res.status(400).json({ message: 'Para cadastrar um produto, são necessários os campos: nome, categoria, marca, preço e quantidade.' });
    }
    if (!idDistribuidor) {
        return res.status(400).json({ message: 'Id do distribuidor não fornecido.' });
    }

    try {
        // Chama o serviço para cadastrar o produto
        const produto = await distribuidorService.cadastrarProduto({
            idDistribuidor,
            categoria,
            marca,
            nome,
            preco,
            quantidade
        });

        // Retorna a resposta de sucesso
        return res.status(201).json({
            message: `Produto '${produto.nome}' cadastrado com sucesso.`,
            produto,
        });
    } catch (error) {
        console.error('Erro ao cadastrar produto:', error);
        return res.status(500).json({
            message: 'Erro interno ao cadastrar o produto.',
        });
    }
};

exports.excluirProduto = async (req, res) => {
    const { idDistribuidor, nomeProduto } = req.body;

    if (!nomeProduto) {
        return res.status(400).json({ message: 'O nome do produto a ser excluído não foi fornecido.' });
    }

    try {
        const resultado = await distribuidorService.excluirProduto(idDistribuidor, nomeProduto);

        if (resultado) {
            return res.status(200).json({
                message: `Produto '${resultado.nome}' excluído com sucesso.`,
            });
        }

        return res.status(404).json({
            message: `Nenhum produto encontrado com um nome semelhante. Nome fornecido: '${nomeProduto}'`,
        });
    } catch (error) {
        console.error('Erro ao excluir produto:', error);
        return res.status(500).json({
            message: 'Erro interno ao excluir o produto.',
        });
    }
};

exports.buscarProduto = async (req, res) => {
    const { idDistribuidor, nomeProduto } = req.body;

    if (!nomeProduto) {
        return res.status(400).json({ message: 'O nome do produto a ser buscado não foi fornecido.' });
    }

    try {
        const resultado = await distribuidorService.buscarProduto(idDistribuidor, nomeProduto);

        if (resultado.matchPerfeito) {
            return res.status(200).json({
                message: 'Produto encontrado com match perfeito.',
                produto: resultado.matchPerfeito,
            });
        } else if (resultado.proximos.length > 0) {
            return res.status(200).json({
                message: 'Nenhum match perfeito encontrado. Exibindo os produtos mais próximos.',
                produtos: resultado.proximos,
            });
        } else {
            return res.status(404).json({
                message: `Nenhum produto encontrado com um nome semelhante. Nome fornecido: '${nomeProduto}'`,
            });
        }
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        return res.status(500).json({
            message: 'Erro interno ao buscar o produto.',
        });
    }
};

exports.editarProduto = async (req, res) => {
    const { idDistribuidor, nomeProduto, dadosAtualizados } = req.body;

    if (!nomeProduto || !dadosAtualizados) {
        return res.status(400).json({
            message: 'Os campos nomeProduto e dadosAtualizados são obrigatórios.'
        });
    }

    // Valida se apenas os campos permitidos estão sendo atualizados
    const camposPermitidos = ['preco', 'quantidade'];
    const camposInvalidos = Object.keys(dadosAtualizados).filter(
        (campo) => !camposPermitidos.includes(campo)
    );

    if (camposInvalidos.length > 0) {
        return res.status(400).json({
            message: `Os seguintes campos não podem ser editados: ${camposInvalidos.join(', ')}`
        });
    }

    try {
        // Chama o serviço para editar o produto
        const produtoEditado = await distribuidorService.editarProduto(
            idDistribuidor,
            nomeProduto,
            dadosAtualizados
        );

        if (produtoEditado) {
            return res.status(200).json({
                message: 'Produto editado com sucesso.',
                produto: produtoEditado,
            });
        } else {
            return res.status(404).json({
                message: 'Nenhum produto encontrado com o nome fornecido ou semelhante.',
            });
        }
    } catch (error) {
        console.error('Erro ao editar produto:', error);
        return res.status(500).json({
            message: 'Erro interno ao editar o produto.',
        });
    }
};

exports.consultarFatura = async (req, res) => {
    const { idDistribuidor } = req.body;

    if (!idDistribuidor) {
        return res.status(400).json({ 
            message: "O campo idDistribuidor é obrigatório." 
        });
    }

    try {
        const fatura = await distribuidorService.consultarFatura(idDistribuidor);

        if (fatura) {
            return res.status(200).json(fatura);
        } else {
            return res.status(404).json({
                message: "Distribuidor não encontrado ou sem dados de cliques."
            });
        }
    } catch (error) {
        console.error("Erro ao consultar fatura:", error);
        return res.status(500).json({
            message: "Erro interno ao consultar a fatura."
        });
    }
};