import * as cheerio from 'cheerio';
import prisma from '../config/database.js';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

const STAR_ORIGIN = 'https://www.starhealth.in';
const LIST_URL = `${STAR_ORIGIN}/list-products/`;
const cache = { savedAt: 0, products: [] };
const normalize = (value = '') => value.replace(/\s+/g, ' ').trim();
const headers = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml',
  'Accept-Language': 'en-US,en;q=0.9',
};
const absoluteStarUrl = (href, fallback = '') => {
  if (!href) return fallback;
  try {
    const url = new URL(href, STAR_ORIGIN);
    return ['starhealth.in', 'www.starhealth.in', 'web.starhealth.in'].includes(url.hostname) ? url.href : fallback;
  } catch { return fallback; }
};
async function fetchPage(url) {
  const response = await fetch(url, { headers, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`Star Health website returned ${response.status}`);
  return response.text();
}
function classify(name) {
  const value = name.toLowerCase();
  if (/travel|student travel|corporate travel/.test(value)) return 'travel';
  if (/accident|suraksha/.test(value)) return 'accident';
  if (/surplus|extra protect|flexi|top.?up|add.?on/.test(value)) return 'top-up';
  if (/diabet|cardiac|cancer|critical illness|special care/.test(value)) return 'specialty';
  if (/women|out.?patient|hospital cash|micro rural|group opd/.test(value)) return 'women-other';
  return 'individual-family';
}
function parseProducts(html, linkHtml = html) {
  const $ = cheerio.load(html);
  const linkRoot = cheerio.load(linkHtml);
  const productLinks = new Map();
  linkRoot('a[href]').each((_, anchor) => {
    const text = normalize(linkRoot(anchor).text()).toLowerCase();
    const href = absoluteStarUrl(linkRoot(anchor).attr('href'));
    if (text && href && href !== LIST_URL) productLinks.set(text, href);
  });
  const products = [];
  $('tr').each((_, row) => {
    const cells = $(row).find('td').map((__, cell) => normalize($(cell).text())).get();
    if (cells.length < 3 || !/^\d+$/.test(cells[0]) || !cells[1]) return;
    const rowHref = absoluteStarUrl($(row).find('a[href]').first().attr('href'));
    const matchingHref = [...productLinks.entries()].find(([text]) => text === cells[1].toLowerCase() || text.includes(cells[1].toLowerCase()))?.[1];
    products.push({
      id: `star-${cells[2] || cells[1]}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      name: cells[1], baseName: cells[1], provider: 'Star Health', planType: classify(cells[1]),
      planNumber: cells[2] || '', uin: cells[2] || '', launchDate: cells[3] || '',
      officialUrl: rowHref || matchingHref || LIST_URL, sourceUrl: LIST_URL,
    });
  });
  return products.filter((item, index, all) => all.findIndex((other) => other.uin === item.uin) === index);
}
async function loadProducts() {
  if (cache.products.length && Date.now() - cache.savedAt < 30 * 60 * 1000) return cache.products;
  const [listHtml, sitemapHtml] = await Promise.all([fetchPage(LIST_URL), fetchPage(`${STAR_ORIGIN}/sitemap/`)]);
  const products = parseProducts(listHtml, sitemapHtml);
  if (!products.length) throw new Error('No products were found on the Star Health product list');
  cache.products = products; cache.savedAt = Date.now();
  return products;
}
function sections($, labels) {
  const values = [];
  $('h1,h2,h3,h4,h5,h6').each((_, heading) => {
    const title = normalize($(heading).text()).toLowerCase();
    if (!labels.some((label) => title.includes(label))) return;
    let node = $(heading).next();
    while (node.length && !/^h[1-6]$/i.test(node[0].tagName) && values.length < 12) {
      const items = node.find('li').map((__, item) => normalize($(item).text())).get();
      if (items.length) values.push(...items); else if (normalize(node.text())) values.push(normalize(node.text()));
      node = node.next();
    }
  });
  return [...new Set(values)].filter(Boolean);
}
export const getStarHealthPlanTypes = async (req, res) => {
  const planTypes = [
    ['individual-family', 'Individual & Family', 'Health plans for individuals and families.'],
    ['specialty', 'Specialised Health Plans', 'Plans for specific diseases and medical needs.'],
    ['accident', 'Personal Accident', 'Accident protection products.'],
    ['top-up', 'Top-up & Add-on Plans', 'Additional cover above the base health policy.'],
    ['travel', 'Travel Insurance', 'Medical and travel protection products.'],
    ['women-other', 'Women & Other Plans', 'Women-focused and other health products.'],
  ].map(([slug, name, description]) => ({ id: slug, slug, name, description, categorySlug: 'health-insurance', isActive: true }));
  return sendSuccess(res, 'Health insurance plan types fetched', planTypes);
};
export const getStarHealthProducts = async (req, res) => {
  try {
    const products = await loadProducts();
    const filtered = req.query.planType ? products.filter((item) => item.planType === req.query.planType) : products;
    return sendSuccess(res, 'Official Star Health products fetched', filtered);
  } catch (error) { return sendError(res, 'Unable to fetch official Star Health products', 502, error.message); }
};
export const getStarHealthProductDetails = async (req, res) => {
  try {
    const requested = new URL(req.query.url);
    if (!['starhealth.in', 'www.starhealth.in', 'web.starhealth.in'].includes(requested.hostname)) return sendError(res, 'Only official Star Health URLs are allowed', 400);
    const html = await fetchPage(requested.href);
    const $ = cheerio.load(html);
    $('script,style,noscript,nav,footer').remove();
    const description = normalize($('meta[name="description"]').attr('content') || $('h1').first().next('p').text());
    const pageText = normalize($('main').text() || $('body').text());
    const ageMatches = [...pageText.matchAll(/(?:minimum|maximum|entry)\s+age[^.]{0,100}(?:year|yr)/ig)].map((match) => normalize(match[0]));
    const benefits = sections($, ['benefit', 'feature', 'why choose']);
    const eligibility = sections($, ['eligibility', 'who can buy']);
    const coverage = sections($, ['coverage', 'what is covered', 'cover']);
    const premium = sections($, ['premium']);
    const policyTerm = sections($, ['policy term', 'tenure']);
    const documents = sections($, ['documents required', 'claim documents']);
    return sendSuccess(res, 'Official Star Health product details fetched', {
      ageRange: [...new Set(ageMatches)].slice(0, 4).join(' | '), shortDescription: description.slice(0, 350),
      description: description.slice(0, 1800), benefits, eligibility, coverage,
      premiumInfo: premium.join('\n').slice(0, 1800), policyTerm: policyTerm.join('\n').slice(0, 1200), documents,
      imageUrl: absoluteStarUrl($('meta[property="og:image"]').attr('content')), officialUrl: requested.href,
    });
  } catch (error) { return sendError(res, 'Unable to fetch official Star Health product details', 502, error.message); }
};

