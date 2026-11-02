const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const lab = require('../lab.json');
function visible(user) { return { id: String(user._id), email: user.email, role: user.role }; }
async function register({ email, password }) {
  // Повышение роли через публичную регистрацию запрещено.
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email: email.trim().toLowerCase(), password: hash, role: 'client' });
  return visible(user);
}
async function login({ email, password }) {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password');
  if (!user || !(await bcrypt.compare(password, user.password))) {
    const e = new Error('Неверный email или пароль'); e.status = 401; throw e;
  }
  if (lab.stage === 13) return visible(user);
  const token = jwt.sign({ userId: String(user._id), role: user.role }, process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRES || '1h', issuer: 'fitness-api', audience: 'fitness-client' });
  return { user: visible(user), token };
}
module.exports = { register, login };
