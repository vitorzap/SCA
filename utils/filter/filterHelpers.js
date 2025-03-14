// Função para selecionar aleatoriamente N elementos de um array
function selectRandomElements(array, numToSelect) {
  if (!Array.isArray(array)) {
    throw new TypeError(`O parâmetro 'array' deve ser um array. O parametro é ${typeof array}`);
  }
  const selectedElements = [];
  const arrayCopy = array.slice(); // Crie uma cópia do array original
  for (let i = 0; i < numToSelect; i++) {
      const randomIndex = Math.floor(Math.random() * arrayCopy.length);
      selectedElements.push(arrayCopy[randomIndex]);
      arrayCopy.splice(randomIndex, 1); // Remova o elemento selecionado da cópia do array
  }
  return selectedElements;
}

module.exports = selectRandomElements;