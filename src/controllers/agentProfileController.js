import { createRow, listRows, updateRow, withoutRowNumber } from '../services/sheetStore.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getAgentProfile = async (req, res) => {
  try {
    const profile = (await listRows('AgentProfile'))[0];
    if (!profile) {
      return sendError(res, 'Agent profile not found', 404);
    }
    return sendSuccess(res, 'Agent profile fetched successfully', withoutRowNumber(profile));
  } catch (error) {
    return sendError(res, 'Failed to fetch profile', 500, error.message);
  }
};

export const updateAgentProfile = async (req, res) => {
  try {
    const existing = (await listRows('AgentProfile'))[0];
    const profile = existing
      ? await updateRow('AgentProfile', existing.id, req.body)
      : await createRow('AgentProfile', req.body);

    return sendSuccess(res, 'Agent profile updated successfully', profile);
  } catch (error) {
    return sendError(res, 'Failed to update profile', 500, error.message);
  }
};
