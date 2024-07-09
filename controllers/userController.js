import { createError } from '../utils/customError.js';
import { createSuccess } from '../utils/createSuccess.js';
import UserModel from '../models/userModel.js';
import OrganisationModel from '../models/organisationModel.js';

// get single user
const getSingleUser = async (req, res, next) => {
  const userId = req.params.id;

  try {
    // Fetch the user making the request
    const requestingUser = await UserModel.findByPk(req.user.userId, {
      include: {
        model: OrganisationModel,
        through: { attributes: [] },
      },
    });

    // Check if the requested user is the authenticated user or in the same organisations
    if (requestingUser.userId !== userId) {
      const organisations = await OrganisationModel.findAll({
        where: {
          id: requestingUser.Organisations.map((org) => org.orgId),
        },
        include: {
          model: UserModel,
          through: { attributes: [] },
        },
      });

      const userInOrg = organisations.some((org) =>
        org.Users.some((user) => user.userId === userId),
      );

      if (!userInOrg) {
        throw createError('User not in your organisation!', 403);
      }
    }

    // Fetch the user data for the requested userId
    const user = await UserModel.findOne({
      where: { userId },
      include: {
        model: OrganisationModel,
        through: { attributes: [] },
      },
    });

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
