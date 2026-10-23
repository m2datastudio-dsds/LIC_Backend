import { createRow, findRow, listRows, updateRow, withoutRowNumber } from '../services/sheetStore.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const createQuestion = async (req, res) => {
  try {
    const question = await createRow('Questions', {
        userId: req.user.id,
        question: req.body.question,
        status: 'NEW',
    });
    return sendSuccess(res, 'Question submitted successfully', question, 201);
  } catch (error) {
    return sendError(res, 'Failed to submit question', 500, error.message);
  }
};

export const getMyQuestions = async (req, res) => {
  try {
    const questions = (await listRows('Questions')).filter((item) => item.userId === req.user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(withoutRowNumber);
    return sendSuccess(res, 'Questions fetched successfully', questions);
  } catch (error) {
    return sendError(res, 'Failed to fetch questions', 500, error.message);
  }
};

export const getAllQuestions = async (req, res) => {
  try {
    const users = await listRows('Users');
    const questions = (await listRows('Questions')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((item) => ({ ...withoutRowNumber(item), user: withoutRowNumber(users.find((user) => user.id === item.userId) || {}) }));
    return sendSuccess(res, 'Questions fetched successfully', questions);
  } catch (error) {
    return sendError(res, 'Failed to fetch questions', 500, error.message);
  }
};

export const getQuestionById = async (req, res) => {
  try {
    const question = await findRow('Questions', (item) => item.id === req.params.id);
    if (!question) return sendError(res, 'Question not found', 404);
    const user = await findRow('Users', (item) => item.id === question.userId);
    const messages = (await listRows('QuestionMessages')).filter((item) => item.questionId === question.id).map(withoutRowNumber);
    return sendSuccess(res, 'Question fetched successfully', { ...withoutRowNumber(question), user: user ? withoutRowNumber(user) : null, messages });
  } catch (error) {
    return sendError(res, 'Failed to fetch question', 500, error.message);
  }
};

export const replyToQuestion = async (req, res) => {
  try {
    const { text } = req.body;
    const question = await updateRow('Questions', req.params.id, { status: 'RESPONDED', answer: text });
    if (!question) return sendError(res, 'Question not found', 404);

    await createRow('QuestionMessages', {
        questionId: question.id,
        sender: 'AGENT',
        text,
    });

    return sendSuccess(res, 'Response sent successfully');
  } catch (error) {
    return sendError(res, 'Failed to respond', 500, error.message);
  }
};
