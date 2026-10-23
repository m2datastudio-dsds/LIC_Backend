import express from 'express';
import { getStarHealthPlanTypes, getStarHealthProductDetails, getStarHealthProducts } from '../controllers/starHealthCatalogController.js';
const router = express.Router();
router.get('/plan-types', getStarHealthPlanTypes);
router.get('/products', getStarHealthProducts);
router.get('/products/details', getStarHealthProductDetails);
export default router;
