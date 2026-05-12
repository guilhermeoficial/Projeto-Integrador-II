const jwt = require('jsonwebtoken');

const autenticarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ erro: 'Token não fornecido.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: decoded.id, tipo: decoded.tipo };
    next();
  } catch (erro) {
    return res.status(403).json({ erro: 'Token inválido ou expirado.' });
  }
};

module.exports = { autenticarToken };