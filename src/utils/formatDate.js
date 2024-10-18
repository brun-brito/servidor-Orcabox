function formatDate(dateString) {
    // Remove espaços em branco
    const cleanedDate = dateString.replace(/\s+/g, '');

    // Verifica se já está no formato AAAAMMDD (somente dígitos e 8 caracteres)
    if (/^\d{8}$/.test(cleanedDate)) {
        return cleanedDate;
    }

    // Verifica e converte do formato DD/MM/AAAA ou DD-MM-AAAA para AAAAMMDD
    if (/^\d{2}[/\-]\d{2}[/\-]\d{4}$/.test(cleanedDate)) {
        const [day, month, year] = cleanedDate.split(/[/\-]/);
        return `${year}${month}${day}`;
    }

    // Verifica e converte do formato AAAA-MM-DD ou AAAA/MM/DD para AAAAMMDD
    if (/^\d{4}[/\-]\d{2}[/\-]\d{2}$/.test(cleanedDate)) {
        const [year, month, day] = cleanedDate.split(/[/\-]/);
        return `${year}${month}${day}`;
    }

    // Verifica e converte do formato DDMMAAAA para AAAAMMDD
    if (/^\d{8}$/.test(cleanedDate)) {
        const day = cleanedDate.substring(0, 2);
        const month = cleanedDate.substring(2, 4);
        const year = cleanedDate.substring(4, 8);
        return `${year}${month}${day}`;
    }

    // Lança erro caso o formato não seja reconhecido
    throw new Error('Data de nascimento inválida. Formato não reconhecido.');
}

module.exports = formatDate;
