const axios = require('axios');
require('dotenv').config();
const API_TOKEN = process.env.API_KEY_INFOSIMPLES;

// Função genérica para verificar o conselho com base nos parâmetros
exports.verificarConselho = async ({ conselho, uf, inscricao, nome }) => {
    const { url, formData } = buildRequest(conselho, uf, inscricao, nome);

    console.log(`Requisição para API CONSELHO: `, { url, formData });

    try {
        const response = await axios.post(url, formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        const data = response.data;

        if (data.code === 200) {
            // console.log('Resposta da API:', data.data);
            return data.data;
        } else {
            const errorMessage = `Erro da API: ${data.code_message}`;
            console.warn(errorMessage);
            throw new Error(errorMessage);
        }
    } catch (error) {
        if (error.response) {
            console.error('Erro na resposta da API Infosimples:', error.response.data);
            throw new Error(`Erro na API: ${error.response.status}`);
        } else if (error.request) {
            console.error('Erro na comunicação com a API:', error.message);
            throw new Error('Erro na comunicação com a API.');
        } else {
            console.error('Erro:', error.message);
            throw error;
        }
    }
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
