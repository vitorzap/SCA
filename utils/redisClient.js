const Redis = require('ioredis');

let redisClient;

if (!redisClient) {
  redisClient = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    username: process.env.REDIS_USER || 'default',
    password: process.env.REDIS_PASSWORD || undefined,
  });
}

redisClient.on('connect', () => {
  console.log(`Conectado ao REDIS (`+
               `${redisClient.options.host}:`+ 
               `${redisClient.options.port})`
  );
});

redisClient.on('error', (err) => {
  console.error('Erro ao conectar ao REDIS:', err);
});


module.exports = redisClient;