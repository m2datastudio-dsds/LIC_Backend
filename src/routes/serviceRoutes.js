import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { getServices, getServiceById, createService, updateService, deleteService, toggleServiceStatus } from '../controllers/serviceController.js';

const router = express.Router();

router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/', authMiddleware, adminMiddleware, createService);
router.put('/:id', authMiddleware, adminMiddleware, updateService);
router.delete('/:id', authMiddleware, adminMiddleware, deleteService);
router.patch('/:id/status', authMiddleware, adminMiddleware, toggleServiceStatus);

export default router;
