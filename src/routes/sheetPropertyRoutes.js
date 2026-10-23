import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { getProperties, getProperty, createProperty, updateProperty, deleteProperty } from '../controllers/sheetPropertyController.js';

const router = express.Router();
router.get('/', getProperties);
router.get('/:id', getProperty);
router.post('/', authMiddleware, adminMiddleware, createProperty);
router.put('/:id', authMiddleware, adminMiddleware, updateProperty);
router.delete('/:id', authMiddleware, adminMiddleware, deleteProperty);
export default router;
