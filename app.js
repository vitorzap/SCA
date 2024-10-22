const express = require('express');
const logger = require('./logger')
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { UserType } = require('./models'); // Importar o modelo UserType
const redisClient = require('./utils/redisClient');

// Função para carregar os UserTypes e retornar os dados
async function loadUserTypes() {
  try {
    const redisKey = 'userTypesCache';
    const cachedUserTypes = await redisClient.get(redisKey);

    if (cachedUserTypes) {
      return JSON.parse(cachedUserTypes); 
    }

    const userTypeData = await UserType.findAll({
      attributes: ['ID_UserType', 'TypeName', 'UserTypeLevel'],
      raw: true,
    });
    // Armazena os dados no Redis com expiração de 1 dia (86400 segundos)
    await redisClient.set(redisKey, JSON.stringify(userTypeData), 'EX', 86400);
    return userTypeData; // Retorna os dados carregados
  } catch (error) {
    console.error('Error loading user types:', error);
    process.exit(1); // Exit if loading user types fails
  }
}

async function createApp() {
  // Carregar os UserTypes e atribuir a global.userTypes
  global.userTypes = await loadUserTypes(); 
  
  // Criação do app Express após o carregamento de UserTypes
  const app = express();
  
  // Middleware to log requests to a file
  app.use((req, res, next) => {
    const logMessage = `${req.method} ${req.url} ${JSON.stringify(req.body)}`;
    logger.info(logMessage); // Log the request asynchronously
    next();
  });

  app.use(helmet());

  app.use(express.json()); // Middleware for parsing JSON bodies

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Limita cada IP a 100 requisições por 15 minutos
  });
  app.use(limiter);


  // Importando as rotas
  const sessionRoutes = require('./routes/sessionRoutes');
  const companyRoutes = require('./routes/companyRoutes');
  const userRoutes = require('./routes/userRoutes');
  const clientRoutes = require('./routes/clientRoutes');
  const professionalRoutes = require('./routes/professionalRoutes');
  const specialtyRoutes = require('./routes/specialtyRoutes');
  const regularScheduleRoutes = require('./routes/regularScheduleRoutes');

  // Definindo as rotas
  app.use('/api', sessionRoutes);
  app.use('/api', companyRoutes);
  app.use('/api', userRoutes);
  app.use('/api', clientRoutes);
  app.use('/api', professionalRoutes);
  app.use('/api', specialtyRoutes);
  app.use('/api', regularScheduleRoutes);

   // Central error handler
   app.use((err, req, res, next) => {
    console.error('Error encountered:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  });

  return app; // Retorna o app após carregar as rotas
}

module.exports = createApp;