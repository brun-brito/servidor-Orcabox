const cpfService = require('../services/cpfService');

exports.consultarCPF = async (req, res) => {
    const { cpf, birthdate } = req.query;

    if (!cpf || !birthdate) {
        return res.status(400).json({
            status: 400,
            message: 'CPF e data de nascimento são obrigatórios.',
        });
    }

    try {
        const data = await cpfService.consultarCPF(cpf, birthdate);
        res.status(200).json({
            status: 200,
            message: 'Consulta realizada com sucesso.',
            data,
        });
    } catch (error) {
        console.error('Erro no controller:', error.message);

        if (error.message.includes('não retornou dados')) {
            return res.status(404).json({
                status: 404,
                message: 'CPF não encontrado. Verifique os dados e tente novamente.',
            });
        }

        res.status(500).json({
            status: 500,
            message: 'Erro interno ao consultar o CPF.',
        });
    }
};
