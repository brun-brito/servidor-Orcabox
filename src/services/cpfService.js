const formatDate = require('../utils/formatDate');
const request = require('request');

const API_TOKEN = 'pxXxdW4xqw12EMWEEtMMNq8V8_0EJ3E46mD_TT78';

exports.consultarCPF = (cpf, birthdate) => {
    let formattedDate;

    try {
        formattedDate = formatDate(birthdate); // Verifica e formata a data, se necessário
    } catch (error) {
        console.error('Erro ao formatar a data:', error.message);
        return Promise.reject(new Error('Data de nascimento inválida.'));
    }

    const options = {
        method: 'POST',
        url: 'https://api.infosimples.com/api/v2/consultas/receita-federal/cpf',
        form: {
            cpf,
            birthdate: formattedDate,
            token: API_TOKEN,
        },
    };

    console.log('Requisição para API Infosimples:', options); // Log da requisição

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                console.error('Erro ao conectar à API:', error);
                return reject(new Error('Erro ao conectar à API.'));
            }

            const data = JSON.parse(body);

            if (data.code === 200) {
                resolve(data.data[0]); // Retorno com sucesso
            } else if (data.code >= 600 && data.code <= 799) {
                const errorMessage = `Erro na consulta: ${data.code_message}`;
                console.warn(errorMessage);
                reject(new Error(errorMessage)); // CPF não encontrado ou outro erro conhecido
            } else {
                reject(new Error('Erro desconhecido na consulta CPF.'));
            }
        });
    });
};
