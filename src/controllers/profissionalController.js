const { buscarCepPorTelefone } = require('../services/profissionalService');

// Controller para buscar o CEP pelo telefone
async function buscarCep(req, res) {
    const { telefone } = req.body;  // Obter o telefone do corpo da requisição

    // Validação dos dados
    if (!telefone) {
        return res.status(400).json({ message: 'O número de telefone é obrigatório.' });
    }

    try {
        // Chama o serviço para buscar o CEP com base no telefone
        const cep = await buscarCepPorTelefone(telefone);

        // Verifica se o CEP foi encontrado
        if (!cep) {
            return res.status(404).json({ message: 'Profissional não encontrado.' });
        }

        // Retorna o CEP encontrado
        return res.status(200).json({ cep });
    } catch (error) {
        console.error('Erro ao buscar o CEP:', error);
        return res.status(500).json({ message: 'Erro interno ao buscar o CEP.' });
    }
}

module.exports = { buscarCep };
