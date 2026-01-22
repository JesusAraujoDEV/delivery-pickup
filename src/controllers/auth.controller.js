import authService from '../services/auth.service.js';

async function login(req, res, next) {
  try {
    const data = await authService.login(req.body);
    return res.json(data);
  } catch (err) {
    if (err?.statusCode) {
      return res.status(err.statusCode).json({
        message: err.message,
        details: err.details,
      });
    }
    return next(err);
  }
}

export default {
  login,
};
