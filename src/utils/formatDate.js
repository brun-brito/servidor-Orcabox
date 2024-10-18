function formatDate(dateString){
    const [year, month, day] = dateString.split('-');
    return `${year}-${month}-${day}`;
};


module.exports = formatDate;