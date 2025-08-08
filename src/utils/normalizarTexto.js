function normalizarTexto(texto) {
    if (!texto) return '';
    
    return texto
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^\w\s]/g, ' ') // Substitui caracteres especiais por espaço
        .replace(/\s+/g, ' ') // Múltiplos espaços viram um só
        .trim();
}

module.exports = normalizarTexto;