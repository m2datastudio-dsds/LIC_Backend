import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { authenticate } from '@google-cloud/local-auth';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const credentialsPath = path.join(
  currentDirectory,
  'google-oauth-credentials.json'
);

const tokenPath = path.join(
  currentDirectory,
  'google-oauth-token.json'
);

const scopes = [
  'https://www.googleapis.com/auth/spreadsheets',
];

async function authorize() {
  const client = await authenticate({
    scopes,
    keyfilePath: credentialsPath,
  });

  if (!client.credentials.refresh_token) {
    throw new Error(
      'Google did not return a refresh token. Remove this app from your Google Account permissions and try again.'
    );
  }

  const credentialsFile = JSON.parse(
    await fs.readFile(credentialsPath, 'utf8')
  );

  const credentials =
    credentialsFile.installed || credentialsFile.web;

  const token = {
    type: 'authorized_user',
    client_id: credentials.client_id,
    client_secret: credentials.client_secret,
    refresh_token: client.credentials.refresh_token,
  };

  await fs.writeFile(
    tokenPath,
    JSON.stringify(token, null, 2)
  );

  console.log('Google authorization completed successfully.');
  console.log(`Token saved to: ${tokenPath}`);
}

authorize().catch((error) => {
  console.error('Google authorization failed:', error.message);
  process.exit(1);
});