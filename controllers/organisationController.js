import { createError } from '../utils/customError.js';
import { createSuccess } from '../utils/createSuccess.js';
import organisationModel from '../models/organisationModel.js';
import userModel from '../models/userModel.js';
import { organisationValidation } from '../validation/organisationValidation.js';
import { addUserValidation } from '../validation/userValidation.js';
import OrganisationModel from '../models/organisationModel.js';
import UserModel from '../models/userModel.js';

// get all organisations
const getOrganisations = async (req, res, next) => {
  const userId = req.user.userId;

  try {
    // Fetch organisations for the logged-in user
    const user = await UserModel.findByPk(userId, {
      include: {
        model: OrganisationModel,
        through: { attributes: [] },
      },
    });

    if (!user) {
      throw createError('User not found', 404);
    }

    console.log(user);

    const userOrganisations = {
      organisations: user.Organisations.map((org) => ({
        orgId: org.orgId,
        name: org.name,
        description: org.description,
      })),
    };

    res
      .status(200)
      .json(
        createSuccess(
          'Organisations retrieved successfully',
          userOrganisations,
        ),
      );
  } catch (error) {
    next(error);
  }
};

// get single organisation
const getSingleOrganisation = async (req, res, next) => {
  const { orgId } = req.params;

  try {
    // Find the organisation by orgId and check if the user has access
    const organisation = await organisationModel.findOne({
      orgId,
      users: req.user.userId,
    });

    if (!organisation) {
      throw createError('Organisation not found!', 404);
    }

    const orgData = {
      orgId: organisation.orgId,
      name: organisation.name,
      description: organisation.description,
    };

    res
      .status(200)
      .json(createSuccess('Organisation retrieved successfully', orgData));
  } catch (error) {
    next(error);
  }
};

// create organisation
const createOrganisation = async (req, res, next) => {
  const { name, description } = req.body;

  try {
    // Validate request body
    const { error } = organisationValidation.validate({ name, description });
    if (error) {
      throw createError('Client error', 400);
    }

    // Create new organisation
    const newOrganisation = await organisationModel.create({
      name,
      description,
    });

    // Add the new organisation to the user's organisations
    await req.user.addOrganisation(newOrganisation.orgId);

    const orgData = {
      orgId: newOrganisation.orgId,
      name: newOrganisation.name,
      description: newOrganisation.description,
    };

    res
      .status(201)
      .json(createSuccess('Organisation created successfully', orgData));
  } catch (error) {
    next(error);
  }
};

// add user to organisation
const addUserToOrganisation = async (req, res, next) => {
  const { orgId } = req.params;
  const { userId } = req.body;

  try {
    // Validate request body
    const { error } = addUserValidation.validate({ userId });
    if (error) {
      throw createError(error.details[0].message, 400);
    }

    // Find the organisation
    const organisation = await OrganisationModel.findByPk(orgId, {
      include: ['Users'],
    });

    if (!organisation) {
      throw createError('Organisation not found', 404);
    }

    // Find the user
    const user = await UserModel.findByPk(userId);
    if (!user) {
      throw createError('User not found', 404);
    }

    // Check if the user is already in the organisation
    const isUserInOrganisation = await organisation.hasUser(user);
    if (isUserInOrganisation) {
      throw createError('User is already in this organisation', 400);
    }

    // Add the user to the organisation
    await organisation.addUser(user);

    res
      .status(200)
      .json(createSuccess('User added to organisation successfully', {}));
  } catch (error) {
    next(error);
  }
};

export {
  getOrganisations,
  getSingleOrganisation,
  createOrganisation,
  addUserToOrganisation,
};
