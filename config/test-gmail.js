import 'dotenv/config';
import { verifyEmailConnection } from '../src/services/emailService.js';

try {
  await verifyEmailConnection();
  console.log('Gmail SMTP connection successful.');
} catch (error) {
  console.error('Gmail SMTP connection failed:', error.message);
  process.exit(1);
}
