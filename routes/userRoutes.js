import express from 'express';
import { getSingleUser } from '../controllers/userController.js';
import requireAuth from '../middleware/requireAuth.js';

const router = express.Router();

// require auth for all user routes
router.use(requireAuth);

// get single user
router.get('/:id', getSingleUser);

export default router;
