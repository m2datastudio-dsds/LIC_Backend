import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import { createQuestion, getMyQuestions, getAllQuestions, getQuestionById, replyToQuestion } from '../controllers/questionController.js';

const router = express.Router();

router.post('/', authMiddleware, createQuestion);
router.get('/my', authMiddleware, getMyQuestions);
router.get('/', authMiddleware, adminMiddleware, getAllQuestions);
router.get('/:id', authMiddleware, getQuestionById);
router.post('/:id/reply', authMiddleware, adminMiddleware, replyToQuestion);

export default router;
