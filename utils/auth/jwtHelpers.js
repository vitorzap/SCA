const jwt = require('jsonwebtoken');

function generateToken(payload, expiresIn = '1h') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

module.exports = { generateToken, verifyToken };