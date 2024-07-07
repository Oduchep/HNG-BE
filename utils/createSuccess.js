export const createSuccess = (message, data = {}) => {
  return {
    status: 'success',
    message: message,
    data: data,
  };
};
