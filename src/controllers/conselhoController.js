const conselhoService = require('../services/conselhoService');

// Controlador para validar conselhos específicos
exports.consultarConselho = async (req, res) => {
    const { conselho, uf, inscricao, nome } = req.body;

    if (!conselho) {
        return res.status(400).json({ message: 'Conselho é obrigatório.' });
    }

    try {
        const data = await conselhoService.verificarConselho({ conselho, uf, inscricao, nome });

        if (data.length === 0) {
            return res.status(404).json({ message: 'Profissional não encontrado.' });
        }

        res.status(200).json({ data });
    } catch (error) {
        console.error(`Erro ao consultar conselho ${conselho}:`, error);
        res.status(500).json({ message: error.message || 'Erro interno ao consultar o conselho.' });
    }
};
