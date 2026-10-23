import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const tokenPath = path.resolve(
  currentDirectory,
  '../../config/google-oauth-token.json'
);

if (!process.env.GOOGLE_SHEET_ID) {
  throw new Error('GOOGLE_SHEET_ID is missing from backend/.env');
}

if (!fs.existsSync(tokenPath)) {
  throw new Error('Google OAuth token file was not found');
}

const token = JSON.parse(
  fs.readFileSync(tokenPath, 'utf8')
);

const auth = google.auth.fromJSON(token);

auth.scopes = [
  'https://www.googleapis.com/auth/spreadsheets',
];

const sheets = google.sheets({
  version: 'v4',
  auth,
});

export const spreadsheetId =
  process.env.GOOGLE_SHEET_ID;

export default sheets;