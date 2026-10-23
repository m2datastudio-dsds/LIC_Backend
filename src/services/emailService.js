import 'dotenv/config';
import nodemailer from 'nodemailer';

const escapeHtml = (value = '') => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const gmailUser = process.env.GMAIL_USER?.trim();
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, '');
const notificationEmail = process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || gmailUser;

const transporter = gmailUser && gmailAppPassword
  ? nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailAppPassword },
    })
  : null;

export async function sendEnquiryNotification(enquiry) {
  if (!transporter || !notificationEmail) {
    console.warn('Email notification skipped: Gmail SMTP settings are not configured.');
    return { sent: false, reason: 'not_configured' };
  }

  const name = enquiry.customerName || enquiry.name || 'Website visitor';
  const subject = enquiry.subject || 'New website enquiry';
  const message = enquiry.message || enquiry.question || '';
  const replyTo = enquiry.email || undefined;

  const info = await transporter.sendMail({
    from: `LIC Insurance Website <${gmailUser}>`,
    to: notificationEmail,
    replyTo,
    subject: `[LIC Website] ${subject}`,
    text: `New enquiry received\n\nName: ${name}\nEmail: ${enquiry.email || '-'}\nMobile: ${enquiry.mobile || '-'}\nSubject: ${subject}\n\nMessage:\n${message}`,
    html: `<h2>New website enquiry</h2><p><strong>Name:</strong> ${escapeHtml(name)}</p><p><strong>Email:</strong> ${escapeHtml(enquiry.email || '-')}</p><p><strong>Mobile:</strong> ${escapeHtml(enquiry.mobile || '-')}</p><p><strong>Subject:</strong> ${escapeHtml(subject)}</p><p><strong>Message:</strong></p><p style="white-space:pre-wrap">${escapeHtml(message)}</p>`,
  });

  return { sent: true, messageId: info.messageId };
}

export async function verifyEmailConnection() {
  if (!transporter) throw new Error('GMAIL_USER and GMAIL_APP_PASSWORD must be configured');
  await transporter.verify();
  return true;
}
