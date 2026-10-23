import { createRow, listRows, updateRow, withoutRowNumber } from '../services/sheetStore.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { sendEnquiryNotification } from '../services/emailService.js';

export const createContactMessage = async (req, res) => {
  try {
    const message = await createRow('ContactMessages', { ...req.body, status: req.body.status || 'NEW' });
    try { await sendEnquiryNotification(message); }
    catch (emailError) { console.error('Contact enquiry email failed:', emailError.message); }
    return sendSuccess(res, 'Contact message sent successfully', message, 201);
  } catch (error) {
    return sendError(res, 'Failed to send message', 500, error.message);
  }
};

export const getContactMessages = async (req, res) => {
  try {
    const messages = (await listRows('ContactMessages')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(withoutRowNumber);
    return sendSuccess(res, 'Contact messages fetched successfully', messages);
  } catch (error) {
    return sendError(res, 'Failed to fetch contact messages', 500, error.message);
  }
};

export const updateContactStatus = async (req, res) => {
  try {
    const message = await updateRow('ContactMessages', req.params.id, { status: req.body.status });
    if (!message) return sendError(res, 'Contact message not found', 404);
    return sendSuccess(res, 'Contact status updated successfully', message);
  } catch (error) {
    return sendError(res, 'Failed to update contact status', 500, error.message);
  }
};
