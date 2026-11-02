const { body, validationResult } = require('express-validator');
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array().map(e => e.msg).join('; ') });
  next();
};
exports.workout = [
  body('type').optional().isString().trim().isLength({ min: 2, max: 80 }).withMessage('Тип: от 2 до 80 символов'),
  body('duration').optional().isInt({ min: 1, max: 300 }).withMessage('Длительность: целое число от 1 до 300'),
  body('calories').optional().isFloat({ min: 0 }).withMessage('Калории: число от 0'),
  body('date').optional().isISO8601().withMessage('Некорректная дата'),
  body('trainer').optional().isString().isLength({ max: 80 }),
  body('exercises').optional().isArray({ max: 30 }),
  body('exercises.*').optional().isString().isLength({ max: 100 }),
  body('tags').optional().isArray({ max: 15 }),
  body('tags.*').optional().isString().isLength({ max: 30 }), validate
];
exports.credentials = [
  body('email').isString().isEmail().isLength({ max: 120 }).withMessage('Некорректный email'),
  body('password').isString().isLength({ min: 6, max: 72 }).withMessage('Пароль: от 6 до 72 символов'), validate
];
