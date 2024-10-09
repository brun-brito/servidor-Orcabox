const { buscarProdutoPorNome } = require('../services/produtoService');

async function buscarProduto(req, res) {
    const nomeProduto = req.query.nome;  // Obter o nome do produto da query string

    if (!nomeProduto) {
        return res.status(400).json({ message: 'Nome do produto é obrigatório.' });
    }

    try {
        const produtos = await buscarProdutoPorNome(nomeProduto);
        if (produtos.length === 0) {
            return res.status(404).json({ message: 'Nenhum produto encontrado.' });
        }
        return res.status(200).json(produtos);
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        return res.status(500).json({ message: 'Erro interno ao buscar produto.' });
    }
}

module.exports = { buscarProduto };
