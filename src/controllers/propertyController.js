import prisma from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const normalize = (body) => ({
  title: body.title,
  propertyType: body.propertyType,
  listingType: body.listingType || 'SALE',
  status: body.status || 'AVAILABLE',
  price: body.price,
  location: body.location,
  address: body.address || null,
  bedrooms: body.bedrooms === '' || body.bedrooms == null ? null : Number(body.bedrooms),
  bathrooms: body.bathrooms === '' || body.bathrooms == null ? null : Number(body.bathrooms),
  area: body.area === '' || body.area == null ? null : Number(body.area),
  areaUnit: body.areaUnit || 'sq ft',
  description: body.description || null,
  amenities: Array.isArray(body.amenities) ? body.amenities : [],
  media: Array.isArray(body.media) ? body.media : [],
  contactName: body.contactName || null,
  contactPhone: body.contactPhone || null,
  isFeatured: Boolean(body.isFeatured),
  isActive: body.isActive ?? true,
});

export const getProperties = async (req, res) => {
  try {
    const where = req.query.active === 'false' ? {} : { isActive: true };
    const properties = await prisma.property.findMany({ where, orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }] });
    return sendSuccess(res, 'Properties fetched successfully', properties);
  } catch (error) { return sendError(res, 'Failed to fetch properties', 500, error.message); }
};

export const getProperty = async (req, res) => {
  try {
    const property = await prisma.property.findUnique({ where: { id: req.params.id } });
    return property ? sendSuccess(res, 'Property fetched successfully', property) : sendError(res, 'Property not found', 404);
  } catch (error) { return sendError(res, 'Failed to fetch property', 500, error.message); }
};

export const createProperty = async (req, res) => {
  try {
    if (!req.body.title || !req.body.propertyType || req.body.price === '' || !req.body.location) return sendError(res, 'Title, property type, price and location are required', 400);
    const base = slugify(req.body.title);
    const property = await prisma.property.create({ data: { ...normalize(req.body), slug: `${base}-${Date.now().toString(36)}` } });
    return sendSuccess(res, 'Property created successfully', property, 201);
  } catch (error) { return sendError(res, 'Failed to create property', 500, error.message); }
};

export const updateProperty = async (req, res) => {
  try {
    const property = await prisma.property.update({ where: { id: req.params.id }, data: normalize(req.body) });
    return sendSuccess(res, 'Property updated successfully', property);
  } catch (error) { return sendError(res, 'Failed to update property', 500, error.message); }
};

export const deleteProperty = async (req, res) => {
  try { await prisma.property.delete({ where: { id: req.params.id } }); return sendSuccess(res, 'Property deleted successfully'); }
  catch (error) { return sendError(res, 'Failed to delete property', 500, error.message); }
};
