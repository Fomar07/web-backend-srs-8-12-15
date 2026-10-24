module.exports = (err, req, res, next) => {
  if (res.headersSent) return next(err);
  let status = err.status || 500;
  let message = err.message;
  if (err.type === 'entity.parse.failed') { status=400; message='Malformed JSON'; }
  if (err.name === 'ValidationError' || err.name === 'CastError') { status=400; message='Invalid data'; }
  if (err.code === 11000) { status=409; message='Duplicate value'; }
  if (status >= 500) message='Internal server error';
  res.status(status).json({error:message});
};
