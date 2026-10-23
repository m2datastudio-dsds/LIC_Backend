import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { createPlanType, getPlanTypes } from '../controllers/planTypeController.js';
const router = express.Router();
router.get('/', getPlanTypes);
router.post('/', authMiddleware, adminMiddleware, createPlanType);
export default router;
