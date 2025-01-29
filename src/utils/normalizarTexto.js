
function normalizarTexto(texto) {
    const textoSemAcento = texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const textoNormalizado = textoSemAcento.replace(/[^a-z0-9]/gi, '').toLowerCase();
    return textoNormalizado;
}

module.exports = normalizarTexto;