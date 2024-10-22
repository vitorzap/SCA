const { User } = require('../models');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { getTokenFromHeader ,isTokenBlacklisted } = require('../utils/authorizationHelper'); // Importa a função de verificação do token

dotenv.config();

const verifyToken = async (req, res, next) => {

  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ 
        error: 'Authorization header is required or Token not found in the authorization header' 
      });
    }

    // Usa a função isTokenBlacklisted para verificar se o token está na blacklist do Redis
    const isBlacklisted = await isTokenBlacklisted(token);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token is blacklisted' });
    }

    // Verify the token
    let decodedToken 
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    } catch (erro) {
      return res.status(401).json({ error: 'Token decoding error'});
    }
    if (!decodedToken.ID_Company || !decodedToken.userTypeID) {
      return res.status(401).json({ error: 'Token is missing essential information.' });
    }

    // Check if the token_version matches the one in the database
    const user = await User.findByPk(decodedToken.id);
    if (!user || user.token_version !== decodedToken.token_version) {
      return res.status(401).json({ error: 'Token is invalid due to password change' });
    }

    // Popula req.user com o payload do token decodificado
    req.user = {
      id: decodedToken.id,
      ID_Company: decodedToken.ID_Company,
      userTypeID: decodedToken.userTypeID,
      userTypeName: decodedToken.userTypeName,
      userTypeLevel: decodedToken.userTypeLevel
    }; 
    next(); // Move to the next middleware or route handler
  }  catch (erro) {
    return res.status(401).json({ error: `Unauthorized(Erro=${erro.message})` });
  }
};

module.exports = { verifyToken };
