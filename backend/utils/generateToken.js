const jwt = require('jsonwebtoken');

const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET || 'default_jwt_secret_dev',
    { expiresIn: '7d' }
  );
};

module.exports = generateToken;
