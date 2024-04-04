console.log('INDEX.JS =>> Iniciando')

const app = require('./app'); // Importando o aplicativo Express de app.js

const PORT = process.env.PORT || 3000; // Porta em que o servidor será executado

console.log('INDEX.JS =>> I********')

app.listen(PORT, () => {
  console.log(`Application started on port ${PORT}`);
});
