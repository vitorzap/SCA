const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Assuming tokenBlacklist is stored globally or passed appropriately
const tokenBlacklist = global.tokenBlacklist || new Set();

const verifyToken = (req, res, next) => {

  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) return res.sendStatus(401); // If no token is present in the request

  if (tokenBlacklist.has(token)) {
    return res.status(401).json({ error: 'Token has been logged out. Please log in again.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err,  decodedToken) => {
    if (err) return res.sendStatus(403); // Invalid token
    // Por exemplo, validar se ID_Company ou UserType estão presentes no token
    if (!decodedToken.ID_Company || !decodedToken.UserType) {
      return res.status(401).json({ error: 'Token is missing essential information.' });
    }

    // Popula req.user com o payload do token decodificado
    req.user = {
      id: decodedToken.id,
      ID_Company: decodedToken.ID_Company,
      UserType: decodedToken.UserType
    }; 
    next(); // Move to the next middleware or route handler
  });
};

const isAdminOrRoot = (req, res, next) => {
  // Verifica se o UserType é 'Admin' ou 'Root'
  if (req.user.UserType !== 'Admin' && req.user.UserType !== 'Root') {
      return res.status(403).json({ error: 'Access denied: Admin or Root rights required' });
  }
  next();
};

const isRoot = (req, res, next) => {
  if (req.user.UserType !== 'Root') {
      return res.status(403).json({ error: 'Access denied: Root rights required' });
  }
  next();
};

module.exports = { verifyToken, isAdminOrRoot, isRoot };
