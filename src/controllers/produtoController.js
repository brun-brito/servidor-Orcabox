const { buscarProdutosPorNomes } = require('../services/produtoService');

async function buscarProdutos(req, res) {
    const { produtos, cepUsuario } = req.body;  // Obter a lista de produtos e o CEP do usuário do corpo da requisição

    if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
        return res.status(400).json({ message: 'A lista de produtos e suas quantidades é obrigatória.' });
    }

    if (!cepUsuario) {
        return res.status(400).json({ message: 'O CEP do usuário é obrigatório.' });
    }

    try {
        const resultados = await buscarProdutosPorNomes(produtos, cepUsuario);
        if (resultados.length === 0) {
            return res.status(404).json({ message: 'Nenhum produto encontrado.' });
        }
        return res.status(200).json(resultados);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        return res.status(500).json({ message: 'Erro interno ao buscar produtos.' });
    }
}

module.exports = { buscarProdutos };
