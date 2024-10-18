const cpfService = require('../services/conselhoService');

exports.consultarCPF = async (req, res) => {
    const { cpf, birthdate } = req.query;

    if (!cpf || !birthdate) {
        return res.status(400).json({ error: 'CPF e data de nascimento são obrigatórios.' });
    }

    try {
        const data = await cpfService.consultarCPF(cpf, birthdate);
        res.status(200).json(data);
    } catch (error) {
        console.error('Erro no controller:', error.message);
        res.status(500).json({ error: 'Erro ao consultar CPF.' });
    }
};