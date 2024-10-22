console.log('INDEX.JS =>> Iniciando')

require('dotenv').config();
const http = require('http');
const { gracefulShutdown } = require('./utils/shutdownHelpers');
let server;

// Global variable to store UserTypes
global.userTypes = [];

const PORT = process.env.PORT || 3000; // Porta em que o servidor será executado

const createApp = require('./app'); // Importa a função que cria o app

// Função para iniciar o servidor após iniciar o App
async function startServer() {

  try {
    const app = await createApp() // Create the Express app

    server = http.createServer(app); // Create an HTTP server manually

    server.listen(PORT, () => {
      console.log(`Application started on port ${PORT}`);
    });

    // Attach the shutdown handler
    process.on('SIGTERM', gracefulShutdown(server));
    process.on('SIGINT', gracefulShutdown(server));

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(2); // Exit if there is an error starting the server
  }
}

// Chama a função para iniciar o servidor
startServer(); 
