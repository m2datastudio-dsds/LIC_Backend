import prisma from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getPlanTypes = async (req, res) => {
  try {
    const where = {
      ...(req.query.active === 'false' ? {} : { isActive: true }),
      ...(req.query.category ? { categorySlug: req.query.category } : {}),
    };
    const planTypes = await prisma.insurancePlanType.findMany({ where, orderBy: { createdAt: 'asc' } });
    return sendSuccess(res, 'Insurance plan types fetched successfully', planTypes);
  } catch (error) { return sendError(res, 'Failed to fetch insurance plan types', 500, error.message); }
};

export const createPlanType = async (req, res) => {
  try {
    const { name, description, isActive } = req.body;
    const slug = req.body.slug || name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const item = await prisma.insurancePlanType.create({ data: { name, slug, description, isActive: isActive ?? true } });
    return sendSuccess(res, 'Insurance plan type created', item, 201);
  } catch (error) { return sendError(res, 'Failed to create insurance plan type', 500, error.message); }
};
