const request = require('request');
require('dotenv').config();
const API_TOKEN = process.env.API_KEY_INFOSIMPLES;

// Função genérica para verificar o conselho com base nos parâmetros
exports.verificarConselho = ({ conselho, uf, inscricao, nome }) => {
    const { url, formData } = buildRequest(conselho, uf, inscricao, nome);

    const options = {
        method: 'POST',
        url,
        form: formData,
    };

    console.log(`Requisição para API: `, options);

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                console.error('Erro na API Infosimples:', error);
                return reject(new Error('Erro na comunicação com a API.'));
            }

            const data = JSON.parse(body);

            if (data.code === 200) {
                // console.log('Resposta da API:', data.data);
                resolve(data.data);
            } else {
                const errorMessage = `Erro da API: ${data.code_message}`;
                console.warn(errorMessage);
                reject(new Error(errorMessage));
            }
        });
    });
};

// Função para construir a URL e os parâmetros corretos para cada conselho
function buildRequest(conselho, uf, inscricao, nome) {
    switch (conselho) {
        case 'cro':
            return {
                url: `https://api.infosimples.com/api/v2/consultas/cro/${uf}/cadastro`,
                formData: {
                    inscricao,
                    token: API_TOKEN,
                    timeout: 600,
                },
            };

        case 'cfbm':
            return {
                url: 'https://api.infosimples.com/api/v2/consultas/cfbm/cadastro',
                formData: {
                    registro: inscricao,
                    token: API_TOKEN,
                    timeout: 600,
                },
            };

        case 'cfm':
            return {
                url: 'https://api.infosimples.com/api/v2/consultas/cfm/cadastro',
                formData: {
                    inscricao,
                    uf,
                    token: API_TOKEN,
                    timeout: 600,
                },
            };

        case 'cff':
            return {
                url: 'https://api.infosimples.com/api/v2/consultas/cff/cadastro',
                formData: {
                    uf,
                    municipio: 'todos',
                    categoria: 'farmaceutico',
                    nome,
                    crf: inscricao,
                    token: API_TOKEN,
                    timeout: 600,
                },
            };

        default:
            throw new Error(`Conselho não suportado: ${conselho}`);
    }
}
