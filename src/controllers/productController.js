import prisma from '../config/database.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

const productFields = ['name', 'categoryId', 'provider', 'planType', 'planTypeId', 'planNumber', 'ageRange', 'shortDescription', 'description', 'benefits', 'eligibility', 'coverage', 'premiumInfo', 'policyTerm', 'documents', 'faq', 'imageUrl', 'officialUrl', 'isActive'];
const cleanProductData = (body) => {
  const data = Object.fromEntries(productFields.filter((field) => Object.hasOwn(body, field)).map((field) => [field, body[field]]));
  ['provider', 'planType', 'planTypeId', 'planNumber', 'ageRange', 'shortDescription', 'description', 'premiumInfo', 'policyTerm', 'imageUrl', 'officialUrl'].forEach((field) => {
    if (data[field] === '') data[field] = null;
  });
  return data;
};

export const getProducts = async (req, res) => {
  try {
    const { category, search, active = 'true' } = req.query;

    const where = {
      ...(category ? { category: { slug: category } } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
      ...(active === 'true' ? { isActive: true } : {}),
    };

    const products = await prisma.product.findMany({
      where,
      include: { category: true, insurancePlanType: true },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, 'Products fetched successfully', products);
  } catch (error) {
    return sendError(res, 'Failed to fetch products', 500, error.message);
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true, insurancePlanType: true },
    });

    if (!product) {
      return sendError(res, 'Product not found', 404);
    }

    return sendSuccess(res, 'Product fetched successfully', product);
  } catch (error) {
    return sendError(res, 'Failed to fetch product', 500, error.message);
  }
};

export const createProduct = async (req, res) => {
  try {
    const { name, categoryId } = req.body;

    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return sendError(res, 'Category not found', 404);
    }

    const product = await prisma.product.create({
      data: {
        ...cleanProductData(req.body),
        slug: name.toLowerCase().replace(/\s+/g, '-'),
      },
    });

    return sendSuccess(res, 'Product created successfully', product, 201);
  } catch (error) {
    return sendError(res, 'Failed to create product', 500, error.message);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const current = await prisma.product.findUnique({ where: { id: req.params.id } });
    if (!current) return sendError(res, 'Product not found', 404);
    const data = cleanProductData(req.body);
    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category) return sendError(res, 'Category not found', 404);
    }
    if (data.planTypeId) {
      const planType = await prisma.insurancePlanType.findUnique({ where: { id: data.planTypeId } });
      if (!planType) return sendError(res, 'Selected plan type no longer exists. Please choose another plan type.', 400);
    }
    if (data.name) data.slug = data.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data,
    });

    return sendSuccess(res, 'Product updated successfully', product);
  } catch (error) {
    if (error.code === 'P2002') return sendError(res, 'Another product already uses this name. Please use a different product name.', 409, error.message);
    return sendError(res, 'Failed to update product', 500, error.message);
  }
};

export const deleteProduct = async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    return sendSuccess(res, 'Product deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete product', 500, error.message);
  }
};

export const toggleProductStatus = async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: req.body.isActive },
    });

    return sendSuccess(res, 'Product status updated successfully', product);
  } catch (error) {
    return sendError(res, 'Failed to update status', 500, error.message);
  }
};
