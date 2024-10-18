const request = require('request');
const API_TOKEN = 'pxXxdW4xqw12EMWEEtMMNq8V8_0EJ3E46mD_TT78';

exports.consultarConselhoAPI = (conselho, uf, inscricao) => {
    const url = `https://api.infosimples.com/api/v2/consultas/${conselho}/${uf}/cadastro`;
    const options = {
        method: 'POST',
        url,
        form: {
            inscricao,
            token: API_TOKEN,
        },
    };

    console.log(`Dados enviados: `,options);

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                console.error('Erro na API Infosimples:', error);
                return reject(new Error('Erro na comunicação com a API.'));
            }
            const data = JSON.parse(body);

            if (data.code === 200) {
                resolve(data.data);
            } else {
                const errorMessage = `Erro na consulta: ${data.code_message}`;
                console.warn(errorMessage);
                reject(new Error(errorMessage));
            }
        });
    });
};
