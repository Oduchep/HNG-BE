import { createError } from '../errors/customError.js';
import { createSuccess } from '../middleware/createSuccess.js';
import organisationModel from '../models/organisationModel.js';
import userModel from '../models/userModel.js';
import { organisationValidation } from '../validation/organisationValidation.js';
import { addUserValidation } from '../validation/userValidation.js';

// get all organisations
const getOrganisations = async (req, res, next) => {
  const userId = req.user._id;

  try {
    const organisations = await organisationModel.find({
      users: userId,
    });

    const userOrganisations = {
      organisations: organisations.map((org) => ({
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
      users: req.user._id,
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
      users: [req.user._id],
    });

    // Add the new organisation to the user's organisations
    req.user.organisations.push(newOrganisation._id);
    await req.user.save();

    const orgData = {
      orgId: newOrganisation._id,
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
    const organisation = await organisationModel.findOne({ orgId });
    if (!organisation) {
      throw createError('Organisation not found', 404);
    }

    // Find the user
    const user = await userModel.findOne({ userId });
    if (!user) {
      throw createError('User not found', 404);
    }

    // Check if user is already in the organisation
    if (organisation.users.includes(user._id)) {
      throw createError('User already in the organisation', 400);
    }

    // Add the user to the organisation
    organisation.users.push(user._id);
    await organisation.save();

    // Add the organisation to the user's organisations
    user.organisations.push(organisation._id);
    await user.save();

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
