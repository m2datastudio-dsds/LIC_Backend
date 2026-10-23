import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { google } from 'googleapis';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const tokenPath = path.join(
  currentDirectory,
  'google-oauth-token.json'
);

async function testConnection() {
  if (!process.env.GOOGLE_SHEET_ID) {
    throw new Error('GOOGLE_SHEET_ID is missing from backend/.env');
  }

  const token = JSON.parse(
    await fs.readFile(tokenPath, 'utf8')
  );

  const auth = google.auth.fromJSON(token);
  auth.scopes = [
    'https://www.googleapis.com/auth/spreadsheets',
  ];

  const sheets = google.sheets({
    version: 'v4',
    auth,
  });

  const response = await sheets.spreadsheets.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    fields: 'properties.title,sheets.properties.title',
  });

  console.log(
    `Connected to: ${response.data.properties.title}`
  );

  console.log('Available tabs:');

  for (const sheet of response.data.sheets || []) {
    console.log(`- ${sheet.properties.title}`);
  }
}

testConnection().catch((error) => {
  console.error(
    'Google Sheets connection failed:',
    error.message
  );

  process.exit(1);
});