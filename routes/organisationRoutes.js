import express from 'express';
import requireAuth from '../middleware/requireAuth.js';
import {
  getOrganisations,
  getSingleOrganisation,
} from '../controllers/organisationController.js';

const router = express.Router();

// require auth for all organisation routes
router.use(requireAuth);

// get organisations
router.get('/', getOrganisations);
router.get('/:orgId', getSingleOrganisation);

export default router;
