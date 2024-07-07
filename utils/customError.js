export const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = 'Bad request';
  return error;
};

export const notFoundError = (message = 'Resource not found') =>
  createError(message, 404);

export const badRequestError = (message = 'Bad request') =>
  createError(message, 400);

export const formatErrors = (errorDetails) => {
  return {
    errors: errorDetails.map((error) => ({
      field: error.path.join('.'),
      message: error.message,
    })),
  };
};
