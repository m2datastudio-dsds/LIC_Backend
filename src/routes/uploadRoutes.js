import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { mkdirSync } from 'fs';
import { uploadProductImage, uploadPropertyMedia } from '../controllers/uploadController.js';
import { authMiddleware, adminMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const uploadDirectory = path.resolve(currentDirectory, '../../uploads/products');
mkdirSync(uploadDirectory, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, callback) => callback(null, uploadDirectory),
  filename: (req, file, callback) => {
    const extension = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' }[file.mimetype];
    callback(null, `product-${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)),
});

const propertyDirectory = path.resolve(currentDirectory, '../../uploads/properties');
mkdirSync(propertyDirectory, { recursive: true });
const propertyUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, callback) => callback(null, propertyDirectory),
    filename: (req, file, callback) => callback(null, `property-${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 50 * 1024 * 1024, files: 16 },
  fileFilter: (req, file, callback) => callback(null, ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime'].includes(file.mimetype)),
});

router.post('/product-image', authMiddleware, adminMiddleware, upload.single('image'), uploadProductImage);
router.post('/property-media', authMiddleware, adminMiddleware, propertyUpload.array('media', 16), uploadPropertyMedia);

export default router;
