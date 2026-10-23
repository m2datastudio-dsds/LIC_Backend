import express from 'express';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';
import * as controller from '../controllers/sheetCatalogController.js';

export const productRoutes = express.Router();
productRoutes.get('/', controller.getProducts);
productRoutes.get('/:id', controller.getProductById);
productRoutes.post('/', authMiddleware, adminMiddleware, controller.createProduct);
productRoutes.put('/:id', authMiddleware, adminMiddleware, controller.updateProduct);
productRoutes.delete('/:id', authMiddleware, adminMiddleware, controller.deleteProduct);
productRoutes.patch('/:id/status', authMiddleware, adminMiddleware, controller.toggleProductStatus);

export const categoryRoutes = express.Router();
categoryRoutes.get('/', controller.getCategories);
categoryRoutes.post('/', authMiddleware, adminMiddleware, controller.createCategory);
categoryRoutes.put('/:id', authMiddleware, adminMiddleware, controller.updateCategory);
categoryRoutes.delete('/:id', authMiddleware, adminMiddleware, controller.deleteCategory);

export const planTypeRoutes = express.Router();
planTypeRoutes.get('/', controller.getPlanTypes);
planTypeRoutes.post('/', authMiddleware, adminMiddleware, controller.createPlanType);
