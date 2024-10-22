const jwt = require('jsonwebtoken');
const redisClient = require('./redisClient');
const { User } = require('../models');

// Função para controlar o acesso a diferentes partes do sistema baseado no nível do usuário
const authorizeByUserLevel = (allowedLevels) => {
  return (req, res, next) => {
    if (!allowedLevels.includes(req.user.userTypeLevel)) {
      const message = `Access denied: ${allowedLevels.join(', ')} levels required`;
      return res.status(403).json({ error: message });
    }
    next();
  };
};

// Funcão para verificar se o token esta na blacklist
const isTokenBlacklisted = async (token) => {
  const result = await redisClient.get(`blacklist:${token}`);
  return result !== null;
};

async function invalidateToken(token) {
  try {
    // Decode the token to extract user information
    const decoded = jwt.decode(token);
    console.log(`decoded=${decoded}`)
    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw new Error('User not found.');
    }

    // Increment the token version to invalidate old tokens
    await user.update({ token_version: user.token_version + 1 });

    // Blacklist the token
    const ttl = decoded.exp - Math.floor(Date.now() / 1000); // Calculate the remaining time to expiration
    await redisClient.set(`blacklist:${token}`, 'true', 'EX', ttl);

    console.log('Token invalidated successfully.');
    return true;    
  } catch (error) {
    console.error('Error invalidating token:', error.message);
    throw new Error('Token invalidation failed');
  }
}

function getTokenFromHeader(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  return token || null;
}

module.exports = {
  authorizeByUserLevel,
  isTokenBlacklisted,
  invalidateToken,
  getTokenFromHeader
};
