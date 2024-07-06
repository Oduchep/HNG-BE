import jwt from 'jsonwebtoken';
import userModel from '../models/userModel.js';
import { createError } from '../errors/customError.js';

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return next(createError('Authorization token required!', 401));
  }

  const token = authorization.split(' ')[1];

  try {
    const { _id } = jwt.verify(token, process.env.SECRET);

    req.user = await userModel.findOne({ _id }).populate('organisations'); // Populate organisations
    if (!req.user) {
      throw createError('User not found', 404);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export default requireAuth;
