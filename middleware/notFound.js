const notFound = (req, res, next) => {
  const error = new Error('Resource URL not found!');
  error.statusCode = 404;
  next(error);
};

export default notFound;
