import { google } from 'googleapis';

if (!process.env.GOOGLE_SHEET_ID) {
  throw new Error('GOOGLE_SHEET_ID is missing');
}

if (!process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64) {
  throw new Error(
    'GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 is missing'
  );
}

const credentials = JSON.parse(
  Buffer.from(
    process.env.GOOGLE_SERVICE_ACCOUNT_JSON_BASE64,
    'base64'
  ).toString('utf8')
);

if (credentials.type !== 'service_account') {
  throw new Error(
    'Google credentials must be a service account JSON file'
  );
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: [
    'https://www.googleapis.com/auth/spreadsheets',
  ],
});

const sheets = google.sheets({
  version: 'v4',
  auth,
});

export const spreadsheetId = process.env.GOOGLE_SHEET_ID;

export default sheets;
