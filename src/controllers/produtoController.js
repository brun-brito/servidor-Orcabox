const { buscarProdutosPorNomes } = require('../services/produtoService');
const { buscarDadosPorTelefone } = require('../services/profissionalService');

async function buscarProdutos(req, res) {
    const { produtos, telefone } = req.body;

    if (!produtos || !Array.isArray(produtos) || produtos.length === 0) {
        return res.status(400).json({ message: 'A lista de produtos e suas quantidades é obrigatória.' });
    }

    if (!telefone) {
        return res.status(400).json({ message: 'O telefone do usuário é obrigatório.' });
    }

    try {
        const profissional = await buscarDadosPorTelefone(telefone);

        if (!profissional) {
            return res.status(404).json({ message: 'Profissional não encontrado.' });
        }

        const resultados = await buscarProdutosPorNomes(produtos, profissional);
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
