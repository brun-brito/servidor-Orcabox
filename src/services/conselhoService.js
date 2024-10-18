const axios = require('axios');
const formatDate = require('../utils/formatDate');

const API_TOKEN = 'pxXxdW4xqw12EMWEEtMMNq8V8_0EJ3E46mD_TT78';

exports.consultarCPF = async (cpf, birthdate) => {
    const formattedDate = formatDate(birthdate);
    const url = `https://api.infosimples.com/api/v2/consultas/receita-federal/cpf?token=${API_TOKEN}&timeout=600&ignore_site_receipt=0&cpf=${cpf}&birthdate=${formattedDate}&origem=web`;

    try {
        const response = await axios.get(url);

        if (response.data.code !== 200) {
            throw new Error(response.data.code_message || 'Erro na consulta do CPF');
        }

        return response.data.data[0]; // Retorna os dados do CPF
    } catch (error) {
        console.error('Erro no serviço:', error.message);
        throw error;
    }
};
