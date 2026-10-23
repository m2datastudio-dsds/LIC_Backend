import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { createRow, findRow, updateRow } from '../src/services/sheetStore.js';

const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD;
const name = process.env.ADMIN_NAME?.trim() || 'Admin User';
const mobile = process.env.ADMIN_MOBILE?.trim() || '';

if (!email || !password) {
  console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env before running this command.');
  process.exit(1);
}
if (password.length < 8) {
  console.error('ADMIN_PASSWORD must contain at least 8 characters.');
  process.exit(1);
}

const passwordHash = await bcrypt.hash(password, 10);
const existing = await findRow('Users', (user) => user.email?.toLowerCase() === email);
const admin = existing
  ? await updateRow('Users', existing.id, { name, mobile: mobile || existing.mobile, passwordHash, role: 'ADMIN', isActive: true })
  : await createRow('Users', { name, email, mobile, passwordHash, role: 'ADMIN', isActive: true });

console.log(`Google Sheets admin is ready: ${admin.email}`);
