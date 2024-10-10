require('dotenv').config();

const urlMap = {};

function gerarLinkCurto(longUrl) {
    const shortId = Math.random().toString(36).substring(2, 8);
    urlMap[shortId] = longUrl;

    return `https://${process.env.ENDERECO_SERVIDOR}/api/${shortId}`;
}

function redirecionarLink(req, res) {
    const shortId = req.params.shortId;
    const longUrl = urlMap[shortId];

    if (longUrl) {
        res.redirect(longUrl);
    } else {
        res.status(404).send("Link não encontrado.");
    }
}

module.exports = {
    gerarLinkCurto,
    redirecionarLink
}
