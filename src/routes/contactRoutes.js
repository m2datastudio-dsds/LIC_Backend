import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { createContactMessage, getContactMessages, updateContactStatus } from '../controllers/contactController.js';

const router = express.Router();

router.post('/', createContactMessage);
router.get('/', authMiddleware, adminMiddleware, getContactMessages);
router.patch('/:id/status', authMiddleware, adminMiddleware, updateContactStatus);

export default router;
