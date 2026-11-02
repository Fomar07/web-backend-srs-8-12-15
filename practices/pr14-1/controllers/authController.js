const service = require('../services/authService');
exports.register = async (req, res) => res.status(201).json(await service.register(req.body));
exports.login = async (req, res) => res.json(await service.login(req.body));
exports.profile = (req, res) => res.json(req.user);
