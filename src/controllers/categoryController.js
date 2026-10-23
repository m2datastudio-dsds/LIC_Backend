import { createRow, deleteRow, listRows, updateRow, withoutRowNumber } from '../services/sheetStore.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';

export const getCategories = async (req, res) => {
  try {
    const categories = (await listRows('Categories')).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(withoutRowNumber);
    return sendSuccess(res, 'Categories fetched successfully', categories);
  } catch (error) {
    return sendError(res, 'Failed to fetch categories', 500, error.message);
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    const category = await createRow('Categories', { name, slug, description });

    return sendSuccess(res, 'Category created successfully', category, 201);
  } catch (error) {
    return sendError(res, 'Failed to create category', 500, error.message);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await updateRow('Categories', req.params.id, req.body);
    if (!category) return sendError(res, 'Category not found', 404);
    return sendSuccess(res, 'Category updated successfully', category);
  } catch (error) {
    return sendError(res, 'Failed to update category', 500, error.message);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    if (!await deleteRow('Categories', req.params.id)) return sendError(res, 'Category not found', 404);
    return sendSuccess(res, 'Category deleted successfully');
  } catch (error) {
    return sendError(res, 'Failed to delete category', 500, error.message);
  }
};
