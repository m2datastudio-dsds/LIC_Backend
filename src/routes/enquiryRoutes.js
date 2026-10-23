import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { createEnquiry, getMyEnquiries, getAllEnquiries, getEnquiryById, replyToEnquiry, updateEnquiryStatus } from '../controllers/enquiryController.js';

const router = express.Router();

router.post('/', authMiddleware, createEnquiry);
router.get('/my', authMiddleware, getMyEnquiries);
router.get('/', authMiddleware, adminMiddleware, getAllEnquiries);
router.get('/:id', authMiddleware, getEnquiryById);
router.post('/:id/reply', authMiddleware, adminMiddleware, replyToEnquiry);
router.patch('/:id/status', authMiddleware, adminMiddleware, updateEnquiryStatus);

export default router;
