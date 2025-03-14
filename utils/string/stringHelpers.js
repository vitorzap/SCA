function joinTextsWithSeparator(texts) {
  return texts.filter(text => text !== null && text !== '').join(' - ');
}

function capitalize(string) {
  if (typeof string !== 'string' || string.length === 0) {
    return string; // Retorna o valor original se não for uma string válida
  }
  return string.charAt(0).toUpperCase() + string.slice(1);
}

module.exports = {
  joinTextsWithSeparator, 
  capitalize
};