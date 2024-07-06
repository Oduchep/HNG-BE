import { createError } from '../errors/customError.js';
import { createSuccess } from '../middleware/createSuccess.js';
import organisationModel from '../models/organisationModel.js';

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

export { getOrganisations, getSingleOrganisation };
