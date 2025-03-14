const { User } = require('../models');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { getTokenFromHeader ,isTokenBlacklisted } = require('../utils/auth/authorizationHelper'); // Importa a função de verificação do token

dotenv.config();

const verifyToken = async (req, res, next) => {
  try {
    if (process.env.NOLOGIN === 'true') {
      // Preenche o payload com valores das variáveis de ambiente ou null
      const noLoginPayload = {
        id: process.env.NOLOGIN_ID || null,
        ID_Company: process.env.NOLOGIN_COMPANY || null,
        userTypeID: process.env.NOLOGIN_UTYPE || null,
        userTypeName: process.env.NOLOGIN_UTYPENAME || null,
        userTypeLevel: process.env.NOLOGIN_UTYPELEVEL || null,
      };
      
      if (noLoginPayload.userTypeLevel != null) {
        if (typeof noLoginPayload.userTypeLevel !== 'number') {
          const converted = Number(noLoginPayload.userTypeLevel);
          noLoginPayload.userTypeLevel = isNaN(converted) ? null : converted;
        }
      }
      
      // Verifica se algum campo está ausente
      const missingFields = Object.entries(noLoginPayload).filter(([key, value]) => value === null);
      if (missingFields.length > 0) {
        const missingKeys = missingFields.map(([key]) => key).join(', ');
        return res.status(500).json({
          error: `Missing environment variables for NOLOGIN mode: ${missingKeys}`,
        });
      }
      req.user = noLoginPayload; // Preenche req.user com os dados do payload  
      return next(); // Pula a autenticação e passa para o próximo middleware
    }

    // Lógica padrão de autenticação
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
