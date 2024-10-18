const { consultarConselhoAPI } = require('../services/conselhoService');

exports.verificarConselho = async (req, res) => {
    const { conselho, uf, inscricao } = req.body;

    if (!conselho || !uf || !inscricao) {
        return res.status(400).json({ message: 'Campos obrigatórios não preenchidos.' });
    }

    try {
        const data = await consultarConselhoAPI(conselho, uf, inscricao);
        res.status(200).json(data);
    } catch (error) {
        console.error('Erro ao verificar conselho:', error.message);
        res.status(500).json({ message: 'Erro ao verificar conselho.' });
    }
};
