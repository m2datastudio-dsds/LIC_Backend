import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { getAgentProfile, updateAgentProfile } from '../controllers/agentProfileController.js';

const router = express.Router();

router.get('/', getAgentProfile);
router.put('/', authMiddleware, adminMiddleware, updateAgentProfile);

export default router;
