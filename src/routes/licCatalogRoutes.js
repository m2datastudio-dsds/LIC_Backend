import express from 'express';
import { getLicProductDetails, getLicProducts } from '../controllers/licCatalogController.js';

const router = express.Router();
router.get('/', getLicProducts);
router.get('/details', getLicProductDetails);
export default router;
