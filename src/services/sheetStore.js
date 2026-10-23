import crypto from 'node:crypto';
import sheets, { spreadsheetId } from '../config/googleSheets.js';

const definitions = {
  Users: ['id', 'name', 'email', 'mobile', 'passwordHash', 'role', 'profilePhoto', 'isActive', 'createdAt', 'updatedAt'],
  Services: ['id', 'name', 'shortDescription', 'fullDescription', 'process', 'documents', 'faq', 'imageUrl', 'category', 'isActive', 'createdAt', 'updatedAt'],
  Enquiries: ['id', 'userId', 'customerName', 'mobile', 'email', 'message', 'status', 'createdAt', 'updatedAt'],
  EnquiryMessages: ['id', 'enquiryId', 'sender', 'text', 'createdAt'],
  Questions: ['id', 'userId', 'question', 'answer', 'status', 'createdAt', 'updatedAt'],
  QuestionMessages: ['id', 'questionId', 'sender', 'text', 'createdAt'],
  AgentProfile: ['id', 'name', 'title', 'bio', 'experience', 'phone', 'email', 'whatsapp', 'location', 'workingHours', 'photoUrl', 'socialLinks', 'createdAt', 'updatedAt'],
  ContactMessages: ['id', 'name', 'mobile', 'email', 'subject', 'message', 'status', 'createdAt', 'updatedAt'],
  Properties: ['id', 'title', 'slug', 'propertyType', 'listingType', 'status', 'price', 'location', 'address', 'bedrooms', 'bathrooms', 'area', 'areaUnit', 'description', 'amenities', 'media', 'contactName', 'contactPhone', 'isFeatured', 'isActive', 'createdAt', 'updatedAt'],
  Categories: ['id', 'name', 'slug', 'description', 'createdAt', 'updatedAt'],
  Products: ['id', 'name', 'slug', 'categoryId', 'provider', 'planType', 'planTypeId', 'planNumber', 'ageRange', 'shortDescription', 'description', 'benefits', 'eligibility', 'coverage', 'premiumInfo', 'policyTerm', 'documents', 'faq', 'imageUrl', 'officialUrl', 'isActive', 'createdAt', 'updatedAt'],
  InsurancePlanTypes: ['id', 'name', 'slug', 'description', 'categorySlug', 'isActive', 'createdAt', 'updatedAt'],
};

const jsonFields = new Set(['documents', 'faq', 'socialLinks', 'amenities', 'media', 'benefits', 'eligibility', 'coverage']);
const booleanFields = new Set(['isActive', 'isFeatured']);
const numberFields = new Set(['price', 'bedrooms', 'bathrooms', 'area']);
const initialized = new Set();

const quote = (name) => `'${name.replaceAll("'", "''")}'`;
const serialize = (field, value) => {
  if (value == null) return '';
  if (jsonFields.has(field)) return JSON.stringify(value);
  return value;
};
const deserialize = (field, value) => {
  if (value == null || value === '') return jsonFields.has(field) ? [] : null;
  if (jsonFields.has(field)) { try { return JSON.parse(value); } catch { return []; } }
  if (booleanFields.has(field)) return value === true || String(value).toLowerCase() === 'true';
  if (numberFields.has(field)) return Number(value);
  return value;
};

async function ensureSheet(name) {
  if (initialized.has(name)) return;
  const headers = definitions[name];
  if (!headers) throw new Error(`Unknown sheet: ${name}`);
  const metadata = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties.title' });
  const exists = metadata.data.sheets?.some((sheet) => sheet.properties.title === name);
  if (!exists) await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ addSheet: { properties: { title: name } } }] } });
  const current = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${quote(name)}!1:1` });
  if (!current.data.values?.[0]?.length) {
    await sheets.spreadsheets.values.update({ spreadsheetId, range: `${quote(name)}!A1`, valueInputOption: 'RAW', requestBody: { values: [headers] } });
  } else if (current.data.values[0].join('|') !== headers.join('|')) {
    throw new Error(`${name} headers do not match the application schema`);
  }
  initialized.add(name);
}

export async function listRows(name) {
  await ensureSheet(name);
  const headers = definitions[name];
  const result = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${quote(name)}!A2:ZZ` });
  return (result.data.values || []).filter((row) => row.some((value) => value !== '')).map((row, index) => ({
    ...Object.fromEntries(headers.map((header, column) => [header, deserialize(header, row[column])])),
    _rowNumber: index + 2,
  }));
}

export async function findRow(name, predicate) {
  return (await listRows(name)).find(predicate) || null;
}

export async function createRow(name, data) {
  await ensureSheet(name);
  const headers = definitions[name];
  const now = new Date().toISOString();
  const record = { id: crypto.randomUUID(), ...data, createdAt: data.createdAt || now, updatedAt: data.updatedAt || now };
  await sheets.spreadsheets.values.append({ spreadsheetId, range: `${quote(name)}!A:ZZ`, valueInputOption: 'RAW', insertDataOption: 'INSERT_ROWS', requestBody: { values: [headers.map((field) => serialize(field, record[field]))] } });
  return Object.fromEntries(headers.map((field) => [field, record[field] ?? (jsonFields.has(field) ? [] : null)]));
}

export async function updateRow(name, id, changes) {
  const rows = await listRows(name);
  const current = rows.find((row) => row.id === id);
  if (!current) return null;
  const headers = definitions[name];
  const record = { ...current, ...changes, id: current.id, updatedAt: new Date().toISOString() };
  delete record._rowNumber;
  await sheets.spreadsheets.values.update({ spreadsheetId, range: `${quote(name)}!A${current._rowNumber}`, valueInputOption: 'RAW', requestBody: { values: [headers.map((field) => serialize(field, record[field]))] } });
  return record;
}

export async function deleteRow(name, id) {
  const rows = await listRows(name);
  const current = rows.find((row) => row.id === id);
  if (!current) return false;
  const metadata = await sheets.spreadsheets.get({ spreadsheetId, fields: 'sheets.properties' });
  const sheetId = metadata.data.sheets.find((sheet) => sheet.properties.title === name)?.properties.sheetId;
  await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests: [{ deleteDimension: { range: { sheetId, dimension: 'ROWS', startIndex: current._rowNumber - 1, endIndex: current._rowNumber } } }] } });
  return true;
}

export const withoutRowNumber = ({ _rowNumber, ...row }) => row;
