import { createRow, deleteRow, findRow, listRows, updateRow, withoutRowNumber } from '../services/sheetStore.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const slugify = (value) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const normalize = (body) => ({
  title: body.title, propertyType: body.propertyType, listingType: body.listingType || 'SALE', status: body.status || 'AVAILABLE',
  price: body.price, location: body.location, address: body.address || null,
  bedrooms: body.bedrooms === '' || body.bedrooms == null ? null : Number(body.bedrooms),
  bathrooms: body.bathrooms === '' || body.bathrooms == null ? null : Number(body.bathrooms),
  area: body.area === '' || body.area == null ? null : Number(body.area), areaUnit: body.areaUnit || 'sq ft',
  description: body.description || null, amenities: Array.isArray(body.amenities) ? body.amenities : [], media: Array.isArray(body.media) ? body.media : [],
  contactName: body.contactName || null, contactPhone: body.contactPhone || null,
  isFeatured: Boolean(body.isFeatured), isActive: body.isActive ?? true,
});

export const getProperties = async (req, res) => {
  try {
    const rows = (await listRows('Properties')).filter((item) => req.query.active === 'false' || item.isActive);
    rows.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || b.createdAt.localeCompare(a.createdAt));
    return sendSuccess(res, 'Properties fetched successfully', rows.map(withoutRowNumber));
  } catch (error) { return sendError(res, 'Failed to fetch properties', 500, error.message); }
};
export const getProperty = async (req, res) => {
  try {
    const item = await findRow('Properties', (row) => row.id === req.params.id);
    return item ? sendSuccess(res, 'Property fetched successfully', withoutRowNumber(item)) : sendError(res, 'Property not found', 404);
  } catch (error) { return sendError(res, 'Failed to fetch property', 500, error.message); }
};
export const createProperty = async (req, res) => {
  try {
    if (!req.body.title || !req.body.propertyType || req.body.price === '' || !req.body.location) return sendError(res, 'Title, property type, price and location are required', 400);
    const item = await createRow('Properties', { ...normalize(req.body), slug: `${slugify(req.body.title)}-${Date.now().toString(36)}` });
    return sendSuccess(res, 'Property created successfully', item, 201);
  } catch (error) { return sendError(res, 'Failed to create property', 500, error.message); }
};
export const updateProperty = async (req, res) => {
  try {
    const item = await updateRow('Properties', req.params.id, normalize(req.body));
    return item ? sendSuccess(res, 'Property updated successfully', item) : sendError(res, 'Property not found', 404);
  } catch (error) { return sendError(res, 'Failed to update property', 500, error.message); }
};
export const deleteProperty = async (req, res) => {
  try { return await deleteRow('Properties', req.params.id) ? sendSuccess(res, 'Property deleted successfully') : sendError(res, 'Property not found', 404); }
  catch (error) { return sendError(res, 'Failed to delete property', 500, error.message); }
};
