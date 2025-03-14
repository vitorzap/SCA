const fs = require('fs');
const path = require('path');

const schemas = {};

// Get the current directory (where index.js is)
const schemaDirectory = __dirname;

// Reads all files in the directory
fs.readdirSync(schemaDirectory).forEach((file) => {
  // Ignores index.js itself and ensures the file ends with .js
  if (file !== 'index.js' && file.endsWith('.js')) {
    // Remove the .js extension
    let schemaName = path.basename(file, '.js');

    // Removes the 'Schema' suffix if present
    schemaName = schemaName.replace(/Schema$/i, '').toUpperCase();

    // Import the schema and add it to the export object
    schemas[schemaName] = require(path.join(schemaDirectory, file));
  }
});

module.exports = schemas;