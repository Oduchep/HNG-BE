import { createError } from '../utils/customError.js';
import { createSuccess } from '../utils/createSuccess.js';
import organisationModel from '../models/organisationModel.js';
import userModel from '../models/userModel.js';

// get single user
const getSingleUser = async (req, res, next) => {
  const userId = req.params.id;

  try {
    // Fetch the user making the request
    const requestingUser = await userModel
      .findById(req.user._id)
      .populate('organisations');

    // Check if the requested user is the authenticated user or in the same organisations
    if (requestingUser.userId !== userId) {
      const organisations = await organisationModel
        .find({
          users: req.user._id,
        })
        .populate('users');

      const userInOrg = organisations.some((org) =>
        org.users.some((user) => user.userId === userId),
      );

      if (!userInOrg) {
        throw createError('User not in your organisation!', 403);
      }
    }

    // Fetch the user data for the requested userId
    const user = await userModel.findOne({ userId }).populate('organisations');

    if (!user) {
      throw createError('User not found', 404);
    }

    const res_data = {
      userId: user.userId,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
    };

    res
      .status(200)
      .json(createSuccess('User data retrieved successfully', res_data));
  } catch (error) {
    next(error);
  }
};

export { getSingleUser };
