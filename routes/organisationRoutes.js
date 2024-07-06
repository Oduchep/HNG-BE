import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import {
  addUserToOrganisation,
  createOrganisation,
  getOrganisations,
  getSingleOrganisation,
} from '../controllers/organisationController.js';

const router = express.Router();

// require auth for all organisation routes
router.use(requireAuth);

// get organisations
router.get('/', getOrganisations);

// get single organisation
router.get('/:orgId', getSingleOrganisation);

// create an organisation
router.post('/', createOrganisation);

// add user to organisation
router.post('/:orgId/users', addUserToOrganisation);

export default router;
