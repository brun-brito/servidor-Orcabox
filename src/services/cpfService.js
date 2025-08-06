const formatDate = require('../utils/formatDate');
const axios = require('axios');

const API_TOKEN = 'pxXxdW4xqw12EMWEEtMMNq8V8_0EJ3E46mD_TT78';

exports.consultarCPF = async (cpf, birthdate) => {
    let formattedDate;

    try {
        formattedDate = formatDate(birthdate); // Verifica e formata a data, se necessário
    } catch (error) {
        console.error('Erro ao formatar a data:', error.message);
        throw new Error('Data de nascimento inválida.');
    }

    const data = {
        cpf,
        birthdate: formattedDate,
        token: API_TOKEN,
    };

    console.log('Requisição para API CPF:', data); // Log da requisição

    try {
        const response = await axios.post('https://api.infosimples.com/api/v2/consultas/receita-federal/cpf', data, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const responseData = response.data;

        if (responseData.code === 200) {
            return responseData.data[0]; // Retorno com sucesso
        } else if (responseData.code >= 600 && responseData.code <= 799) {
            const errorMessage = `Erro na consulta: ${responseData.code_message}`;
            console.warn(errorMessage);
            throw new Error(errorMessage); // CPF não encontrado ou outro erro conhecido
        } else {
            throw new Error('Erro desconhecido na consulta CPF.');
        }
    } catch (error) {
        if (error.response) {
            console.error('Erro na resposta da API:', error.response.data);
            throw new Error(`Erro na API: ${error.response.status}`);
        } else if (error.request) {
            console.error('Erro ao conectar à API:', error.message);
            throw new Error('Erro ao conectar à API.');
        } else {
            console.error('Erro:', error.message);
            throw error;
        }
    }
};
