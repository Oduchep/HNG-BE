import jwt from 'jsonwebtoken';
import { createError } from '../utils/customError.js';
import OrganisationModel from '../models/organisationModel.js';
import UserModel from '../models/userModel.js';

const requireAuth = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    return next(createError('Authorization token required!', 401));
  }
  const token = authorization.split(' ')[1];

  try {
    const { userId } = jwt.verify(token, process.env.SECRET);

    req.user = await UserModel.findOne({
      where: { userId },
      include: {
        model: OrganisationModel,
        through: { attributes: [] }, // Exclude attributes from join table
      },
    });

    if (!req.user) {
      throw createError('User not found', 404);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default requireAuth;
