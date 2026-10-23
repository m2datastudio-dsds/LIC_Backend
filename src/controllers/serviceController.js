import { createRow, deleteRow, findRow, listRows, updateRow, withoutRowNumber } from '../services/sheetStore.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getServices = async (req, res) => {
  try {
    const { category, active = 'true' } = req.query;
    const services = (await listRows('Services')).filter((item) => (!category || item.category === category) && (active !== 'true' || item.isActive)).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(withoutRowNumber);
    return sendSuccess(res, 'Services fetched successfully', services);
  } catch (error) {
    return sendError(res, 'Failed to fetch services', 500, error.message);
  }
};

export const getServiceById = async (req, res) => {
  try {
    const service = await findRow('Services', (item) => item.id === req.params.id);
    if (!service) return sendError(res, 'Service not found', 404);
    return sendSuccess(res, 'Service fetched successfully', withoutRowNumber(service));
  } catch (error) {
    return sendError(res, 'Failed to fetch service', 500, error.message);
  }
};

export const createService = async (req, res) => {
  try {
    const service = await createRow('Services', { ...req.body, isActive: req.body.isActive ?? true });
    return sendSuccess(res, 'Service created successfully', service, 201);
  } catch (error) {
    return sendError(res, 'Failed to create service', 500, error.message);
  }
};

export const updateService = async (req, res) => {
  try {
    const service = await updateRow('Services', req.params.id, req.body);
    if (!service) return sendError(res, 'Service not found', 404);
    return sendSuccess(res, 'Service updated successfully', service);
  } catch (error) {
    return sendError(res, 'Failed to update service', 500, error.message);
  }
};

export const deleteService = async (req, res) => {
  try {
    if (!await deleteRow('Services', req.params.id)) return sendError(res, 'Service not found', 404);
    return sendSuccess(res, 'Service deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete service', 500, error.message);
  }
};

export const toggleServiceStatus = async (req, res) => {
  try {
    const service = await updateRow('Services', req.params.id, { isActive: req.body.isActive });
    if (!service) return sendError(res, 'Service not found', 404);
    return sendSuccess(res, 'Service status updated successfully', service);
  } catch (error) {
    return sendError(res, 'Failed to update service status', 500, error.message);
  }
};
