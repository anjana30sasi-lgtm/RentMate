const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Please log in to continue.' });
  try { req.userId = jwt.verify(token, process.env.JWT_SECRET).id; next(); }
  catch { return res.status(401).json({ message: 'Your session has expired. Please log in again.' }); }
};
