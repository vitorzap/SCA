const { Op } = require('sequelize');

function formatFilter(searchItem) {
  const filter = {};

  if (typeof searchItem === 'string') {
    // Case where searchItem is a string (fixed field: "Name")
    filter.Name = buildFilterCondition(searchItem);
  } else if (typeof searchItem === 'object' && searchItem !== null) {
    // Case where searchItem is an object { key: value }
    const [key, value] = Object.entries(searchItem)[0]; // Extract key and value
    filter[key] = buildFilterCondition(value); // Apply logic to the value
  }

  return filter;
}

function buildFilterCondition(value) {
  if (value.startsWith('*') && value.endsWith('*')) {
    // Caso: *string* (contém a string)
    const searchTerm = value.slice(1, -1); // Remove os asteriscos
    return { [Op.like]: `%${searchTerm}%` };
  } else if (value.endsWith('*')) {
    // Case: string* (starts with string)
    const searchTerm = value.slice(0, -1); // Remove the last asterisk
    return { [Op.like]: `${searchTerm}%` };
  } else {
    // Case: string (equal to string)
    return value;
  }
}

module.exports = { formatFilter };