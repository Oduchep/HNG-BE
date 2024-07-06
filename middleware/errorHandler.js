const errorHandler = (err, req, res, next) => {
  const status = err.status || 'Internal Server Error';
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    status,
    message: err.message,
    statusCode,
  });
};

export default errorHandler;
