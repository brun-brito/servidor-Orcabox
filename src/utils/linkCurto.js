require('dotenv').config();
const { db, admin } = require('../config/firebase');

const urlMap = {};

function gerarLinkCurto(longUrl, distribuidorId, profissional, buscaRealizada) {
    const shortId = Math.random().toString(36).substring(2, 8);
    urlMap[shortId] = {
        longUrl,
        distribuidorId,
        profissional,
        buscaRealizada,
        isValid: true
    };

    return `${process.env.ENDERECO_SERVIDOR}/v1/${shortId}`;
}

async function redirecionarLink(req, res) {
    const shortId = req.params.shortId;
    const linkInfo = urlMap[shortId];

    if (!linkInfo) {
        return res.status(404).send("Link não encontrado.");
    }

    if (!linkInfo.isValid) {
        return res.status(403).send("Este link já foi utilizado e não é mais válido. Por favor, faça uma nova busca.");
    }

    const { longUrl, distribuidorId, profissional, buscaRealizada } = linkInfo;
    const dadosClicador = {
        nome: profissional.nome,
        email: profissional.email,
        telefone: profissional.telefone
    };

    try {
        const distribuidorRef = db.collection('distribuidores').doc(distribuidorId);
        const cliqueData = {
            dadosClicador: dadosClicador,
            horarioClique: admin.firestore.FieldValue.serverTimestamp(),
            produtoBuscado: buscaRealizada,
        };

        // Atualiza o contador total de cliques e adiciona o novo clique à subcoleção
        await distribuidorRef.update({
            cliques: admin.firestore.FieldValue.increment(1)  // Incrementa a contagem total
        });

        await distribuidorRef.collection('cliques').add(cliqueData);  // Armazena o clique

        // Invalida o link após o primeiro uso
        linkInfo.isValid = false;

        res.redirect(longUrl);  // Redireciona para a URL original

    } catch (error) {
        console.error('Erro ao registrar o clique:', error);
        res.status(500).send("Erro interno ao registrar o clique.");
    }
}


module.exports = {
    gerarLinkCurto,
    redirecionarLink
}
