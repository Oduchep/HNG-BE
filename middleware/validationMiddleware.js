// validationMiddleware.js
import Joi from 'joi';
import { badRequestError } from '../errors/customError.js';

export const validateRequest = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return next(badRequestError(error.details[0].message));
  }
  next();
};
