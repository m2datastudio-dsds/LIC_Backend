import { createRow, deleteRow, findRow, listRows, updateRow, withoutRowNumber } from '../services/sheetStore.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const slugify = (value = '') => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const productFields = ['name', 'categoryId', 'provider', 'planType', 'planTypeId', 'planNumber', 'ageRange', 'shortDescription', 'description', 'benefits', 'eligibility', 'coverage', 'premiumInfo', 'policyTerm', 'documents', 'faq', 'imageUrl', 'officialUrl', 'isActive'];
const cleanProduct = (body) => Object.fromEntries(productFields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field] === '' ? null : body[field]]));
const decorate = (product, categories, planTypes) => ({ ...withoutRowNumber(product), category: categories.find((item) => item.id === product.categoryId) ? withoutRowNumber(categories.find((item) => item.id === product.categoryId)) : null, insurancePlanType: planTypes.find((item) => item.id === product.planTypeId) ? withoutRowNumber(planTypes.find((item) => item.id === product.planTypeId)) : null });

export async function getProducts(req, res) {
  try {
    const [products, categories, planTypes] = await Promise.all([listRows('Products'), listRows('Categories'), listRows('InsurancePlanTypes')]);
    const category = req.query.category;
    const search = req.query.search?.toLowerCase();
    const activeOnly = req.query.active !== 'false';
    const rows = products.filter((item) => (!activeOnly || item.isActive) && (!search || item.name?.toLowerCase().includes(search)) && (!category || categories.find((entry) => entry.id === item.categoryId)?.slug === category));
    rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return sendSuccess(res, 'Products fetched successfully', rows.map((item) => decorate(item, categories, planTypes)));
  } catch (error) { return sendError(res, 'Failed to fetch products', 500, error.message); }
}
export async function getProductById(req, res) {
  try {
    const [product, categories, planTypes] = await Promise.all([findRow('Products', (item) => item.id === req.params.id), listRows('Categories'), listRows('InsurancePlanTypes')]);
    return product ? sendSuccess(res, 'Product fetched successfully', decorate(product, categories, planTypes)) : sendError(res, 'Product not found', 404);
  } catch (error) { return sendError(res, 'Failed to fetch product', 500, error.message); }
}
export async function createProduct(req, res) {
  try {
    const category = await findRow('Categories', (item) => item.id === req.body.categoryId);
    if (!category) return sendError(res, 'Category not found', 404);
    const item = await createRow('Products', { ...cleanProduct(req.body), slug: slugify(req.body.name), isActive: req.body.isActive ?? true });
    return sendSuccess(res, 'Product created successfully', item, 201);
  } catch (error) { return sendError(res, 'Failed to create product', 500, error.message); }
}
export async function updateProduct(req, res) {
  try {
    const data = cleanProduct(req.body);
    if (data.categoryId && !await findRow('Categories', (item) => item.id === data.categoryId)) return sendError(res, 'Category not found', 404);
    if (data.planTypeId && !await findRow('InsurancePlanTypes', (item) => item.id === data.planTypeId)) return sendError(res, 'Selected plan type no longer exists. Please choose another plan type.', 400);
    if (data.name) data.slug = slugify(data.name);
    const item = await updateRow('Products', req.params.id, data);
    return item ? sendSuccess(res, 'Product updated successfully', item) : sendError(res, 'Product not found', 404);
  } catch (error) { return sendError(res, 'Failed to update product', 500, error.message); }
}
export async function deleteProduct(req, res) {
  try { return await deleteRow('Products', req.params.id) ? sendSuccess(res, 'Product deleted successfully') : sendError(res, 'Product not found', 404); }
  catch (error) { return sendError(res, 'Failed to delete product', 500, error.message); }
}
export async function toggleProductStatus(req, res) {
  try { const item = await updateRow('Products', req.params.id, { isActive: req.body.isActive }); return item ? sendSuccess(res, 'Product status updated successfully', item) : sendError(res, 'Product not found', 404); }
  catch (error) { return sendError(res, 'Failed to update status', 500, error.message); }
}

export async function getCategories(req, res) { try { const rows = (await listRows('Categories')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(withoutRowNumber); return sendSuccess(res, 'Categories fetched successfully', rows); } catch (error) { return sendError(res, 'Failed to fetch categories', 500, error.message); } }
export async function createCategory(req, res) { try { const item = await createRow('Categories', { name: req.body.name, slug: slugify(req.body.name), description: req.body.description }); return sendSuccess(res, 'Category created successfully', item, 201); } catch (error) { return sendError(res, 'Failed to create category', 500, error.message); } }
export async function updateCategory(req, res) { try { const item = await updateRow('Categories', req.params.id, req.body); return item ? sendSuccess(res, 'Category updated successfully', item) : sendError(res, 'Category not found', 404); } catch (error) { return sendError(res, 'Failed to update category', 500, error.message); } }
export async function deleteCategory(req, res) { try { return await deleteRow('Categories', req.params.id) ? sendSuccess(res, 'Category deleted successfully') : sendError(res, 'Category not found', 404); } catch (error) { return sendError(res, 'Failed to delete category', 500, error.message); } }

export async function getPlanTypes(req, res) { try { const rows = (await listRows('InsurancePlanTypes')).filter((item) => (req.query.active === 'false' || item.isActive) && (!req.query.category || item.categorySlug === req.query.category)).sort((a, b) => a.createdAt.localeCompare(b.createdAt)).map(withoutRowNumber); return sendSuccess(res, 'Insurance plan types fetched successfully', rows); } catch (error) { return sendError(res, 'Failed to fetch insurance plan types', 500, error.message); } }
export async function createPlanType(req, res) { try { const item = await createRow('InsurancePlanTypes', { name: req.body.name, slug: req.body.slug || slugify(req.body.name), description: req.body.description, categorySlug: req.body.categorySlug || null, isActive: req.body.isActive ?? true }); return sendSuccess(res, 'Insurance plan type created', item, 201); } catch (error) { return sendError(res, 'Failed to create insurance plan type', 500, error.message); } }
