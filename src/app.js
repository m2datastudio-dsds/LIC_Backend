import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import questionRoutes from './routes/questionRoutes.js';
import agentProfileRoutes from './routes/agentProfileRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import licCatalogRoutes from './routes/licCatalogRoutes.js';
import starHealthCatalogRoutes from './routes/starHealthCatalogRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import propertyRoutes from './routes/sheetPropertyRoutes.js';
import { productRoutes, categoryRoutes, planTypeRoutes } from './routes/sheetCatalogRoutes.js';
import { sendError } from './utils/apiResponse.js';

dotenv.config();

const app = express();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(helmet());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve(currentDirectory, '../uploads'), {
  setHeaders: (res) => res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin'),
}));
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'LIC Agent API is running', data: { status: 'ok' } });
});

app.use('/api/auth', authRoutes);
app.use('/api/lic-products', licCatalogRoutes);
app.use('/api/star-health', starHealthCatalogRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/plan-types', planTypeRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/agent-profile', agentProfileRoutes);
app.use('/api/contact', contactRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  sendError(res, 'Something went wrong', 500, err.message || 'Internal server error');
});

export default app;

