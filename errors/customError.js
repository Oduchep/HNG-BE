export const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

export const notFoundError = (message = 'Resource not found') =>
  createError(message, 404);
export const badRequestError = (message = 'Bad request') =>
  createError(message, 400);
