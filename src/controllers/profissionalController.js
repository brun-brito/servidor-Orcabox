const { buscarDadosPorTelefone } = require('../services/profissionalService');

// Controller para verificar se o usuário está cadastrado
async function verificarCadastro(req, res) {
    const { telefone } = req.body;  // Obtém o telefone do corpo da requisição

    if (!telefone) {
        return res.status(400).json({ 
            message: 'O número de telefone é obrigatório.', 
            status: false 
        });
    }

    try {
        const profissional = await buscarDadosPorTelefone(telefone);

        if (!profissional) {
            return res.status(404).json({ 
                message: 'Usuário não encontrado ou não cadastrado.', 
                status: false 
            });
        }

        // Se o usuário foi encontrado e o CEP retornado, envia a resposta
        return res.status(200).json({ 
            message: 'Usuário está cadastrado.', 
            status: true, 
            cep: profissional.cep,
            nome: profissional.nome,
        });
    } catch (error) {
        console.error('Erro ao verificar o cadastro:', error);
        return res.status(500).json({ 
            message: 'Erro interno ao verificar o cadastro.', 
            status: false 
        });
    }
}

module.exports = { verificarCadastro };
