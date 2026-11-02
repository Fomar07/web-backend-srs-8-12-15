const jwt = require('jsonwebtoken');
const lab = require('../lab.json');
module.exports = async (req, res, next) => {
  if (lab.stage === 13) {
    // Учебная проверка roleGuard, доступна только в локальной практике 13.
    const role = req.get('X-User-Role');
    if (['client', 'trainer'].includes(role)) req.user = { role };
    return next();
  }
  try {
    const header = req.get('Authorization') || '';
    if (!header.startsWith('Bearer ')) throw new Error();
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET, {
      algorithms: ['HS256'], issuer: 'fitness-api', audience: 'fitness-client'
    });
    const user = await require('../models/User').findById(payload.userId).lean();
    if (!user) throw new Error();
    req.user = { id: String(user._id), role: user.role, email: user.email };
    next();
  } catch { res.status(401).json({ error: 'Токен отсутствует, недействителен или истёк' }); }
};
