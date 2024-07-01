import express from 'express';
import { greetUser } from '../controllers/greetingController.js';

const router = express.Router();

// greeting route
router.get('/hello', greetUser);

export default router;
