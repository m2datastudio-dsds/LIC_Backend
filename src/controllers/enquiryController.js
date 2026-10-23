import { createRow, findRow, listRows, updateRow, withoutRowNumber } from '../services/sheetStore.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import { sendEnquiryNotification } from '../services/emailService.js';

export const createEnquiry = async (req, res) => {
  try {
    const enquiry = await createRow('Enquiries', {
        ...req.body,
        userId: req.user?.id || null,
        status: req.body.status || 'NEW',
    });
    try { await sendEnquiryNotification({ ...enquiry, name: req.user?.name, email: enquiry.email || req.user?.email, mobile: enquiry.mobile || req.user?.mobile }); }
    catch (emailError) { console.error('Customer enquiry email failed:', emailError.message); }
    return sendSuccess(res, 'Enquiry created successfully', enquiry, 201);
  } catch (error) {
    return sendError(res, 'Failed to create enquiry', 500, error.message);
  }
};

export const getMyEnquiries = async (req, res) => {
  try {
    const enquiries = (await listRows('Enquiries')).filter((item) => item.userId === req.user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(withoutRowNumber);
    return sendSuccess(res, 'My enquiries fetched successfully', enquiries);
  } catch (error) {
    return sendError(res, 'Failed to fetch enquiries', 500, error.message);
  }
};

export const getAllEnquiries = async (req, res) => {
  try {
    const users = await listRows('Users');
    const enquiries = (await listRows('Enquiries')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((item) => ({ ...withoutRowNumber(item), user: item.userId ? withoutRowNumber(users.find((user) => user.id === item.userId) || {}) : null }));
    return sendSuccess(res, 'Enquiries fetched successfully', enquiries);
  } catch (error) {
    return sendError(res, 'Failed to fetch enquiries', 500, error.message);
  }
};

export const getEnquiryById = async (req, res) => {
  try {
    const enquiry = await findRow('Enquiries', (item) => item.id === req.params.id);
    if (!enquiry) return sendError(res, 'Enquiry not found', 404);
    const user = enquiry.userId ? await findRow('Users', (item) => item.id === enquiry.userId) : null;
    const messages = (await listRows('EnquiryMessages')).filter((item) => item.enquiryId === enquiry.id).map(withoutRowNumber);
    return sendSuccess(res, 'Enquiry fetched successfully', { ...withoutRowNumber(enquiry), user: user ? withoutRowNumber(user) : null, messages });
  } catch (error) {
    return sendError(res, 'Failed to fetch enquiry', 500, error.message);
  }
};

export const replyToEnquiry = async (req, res) => {
  try {
    const { text } = req.body;
    const enquiry = await updateRow('Enquiries', req.params.id, { status: 'RESPONDED' });
    if (!enquiry) return sendError(res, 'Enquiry not found', 404);

    await createRow('EnquiryMessages', {
        enquiryId: enquiry.id,
        sender: 'AGENT',
        text,
    });

    return sendSuccess(res, 'Reply sent successfully');
  } catch (error) {
    return sendError(res, 'Failed to reply', 500, error.message);
  }
};

export const updateEnquiryStatus = async (req, res) => {
  try {
    const enquiry = await updateRow('Enquiries', req.params.id, { status: req.body.status });
    if (!enquiry) return sendError(res, 'Enquiry not found', 404);
    return sendSuccess(res, 'Enquiry status updated', enquiry);
  } catch (error) {
    return sendError(res, 'Failed to update enquiry status', 500, error.message);
  }
};

