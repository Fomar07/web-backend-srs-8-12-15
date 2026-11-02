const router = require('express').Router();
const { rateLimit } = require('express-rate-limit');
const ctrl = require('../controllers/authController');
const { credentials } = require('../middlewares/validation');
const auth = require('../middlewares/auth');
const guard = require('../middlewares/roleGuard');
const limiter = rateLimit({ windowMs: 60000, limit: 30, standardHeaders: 'draft-8', legacyHeaders: false,
  message: { error: 'Слишком много попыток входа. Повторите через минуту' } });
router.post('/register', limiter, credentials, ctrl.register);
router.post('/login', limiter, credentials, ctrl.login);
router.get('/profile', auth, guard('client', 'trainer'), ctrl.profile);
module.exports = router;
