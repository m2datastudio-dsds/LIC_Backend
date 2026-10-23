import * as cheerio from 'cheerio';
import { PDFParse } from 'pdf-parse';
import { sendError, sendSuccess } from '../utils/apiResponse.js';

const LIC_ORIGIN = 'https://www.licindia.in';
const catalogPages = {
  endowment: '/en/web/guest/endowment-plans',
  'money-back': '/en/web/guest/money-back-plans',
  'whole-life': '/en/web/guest/whole-life-plans',
  term: '/en/web/guest/term-assurance-plans',
  pension: '/en/web/guest/pension-plan',
  ulip: '/en/web/guest/unit-linked-plans',
  child: '/en/web/guest/plans-for-children-s-future',
};

const cache = new Map();
const normalize = (value = '') => value.replace(/\s+/g, ' ').trim();
const absoluteLicUrl = (href, fallback) => {
  if (!href) return fallback;
  try {
    const url = new URL(href || fallback, LIC_ORIGIN);
    return ['licindia.in', 'www.licindia.in'].includes(url.hostname) ? url.href : fallback;
  } catch { return fallback; }
};

async function fetchLicPage(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36',
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
      Referer: `${LIC_ORIGIN}/`,
    },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`LIC website returned ${response.status}`);
  return response.text();
}

async function fetchLicPdf(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36',
      Accept: 'application/pdf',
      Referer: `${LIC_ORIGIN}/`,
    },
    signal: AbortSignal.timeout(30000),
  });
  if (!response.ok) throw new Error(`LIC brochure returned ${response.status}`);
  const size = Number(response.headers.get('content-length') || 0);
  if (size > 20 * 1024 * 1024) throw new Error('LIC brochure is too large to import');
  const parser = new PDFParse({ data: Buffer.from(await response.arrayBuffer()) });
  try { return (await parser.getText()).text; } finally { await parser.destroy(); }
}

function parseCatalog(html, planType, sourceUrl) {
  const $ = cheerio.load(html);
  const products = [];
  $('tr').each((_, row) => {
    const cells = $(row).find('td').map((__, cell) => normalize($(cell).text())).get();
    if (cells.length < 3 || !/^\d+$/.test(cells[0]) || !cells[1]) return;
    const planNumber = cells[2] || '';
    const uin = cells[3] || '';
    const href = $(row).find('a[href]').first().attr('href');
    const officialUrl = absoluteLicUrl(href, sourceUrl);
    products.push({
      id: `${planType}-${planNumber || cells[1]}`.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      planType,
      name: cells[1],
      baseName: cells[1],
      provider: 'LIC',
      planNumber,
      uin,
      officialUrl,
      sourceUrl,
    });
  });
  return products.filter((item, index, all) => all.findIndex((other) => other.name === item.name && other.planNumber === item.planNumber) === index);
}

export const getLicProducts = async (req, res) => {
  const planType = req.query.planType;
  if (!catalogPages[planType]) return sendError(res, 'Unsupported LIC plan type', 400);
  const cached = cache.get(planType);
  if (cached && Date.now() - cached.savedAt < 30 * 60 * 1000) return sendSuccess(res, 'Official LIC products fetched', cached.products);
  try {
    const sourceUrl = `${LIC_ORIGIN}${catalogPages[planType]}`;
    const products = parseCatalog(await fetchLicPage(sourceUrl), planType, sourceUrl);
    if (!products.length) throw new Error('No product rows were found on the LIC page');
    cache.set(planType, { savedAt: Date.now(), products });
    return sendSuccess(res, 'Official LIC products fetched', products);
  } catch (error) {
    return sendError(res, 'Unable to fetch products from the official LIC website', 502, error.message);
  }
};

function sectionItems($, labels) {
  let result = [];
  $('h1,h2,h3,h4,h5,h6').each((_, heading) => {
    const title = normalize($(heading).text()).toLowerCase();
    if (!labels.some((label) => title.includes(label))) return;
    const parts = [];
    let node = $(heading).next();
    while (node.length && !/^h[1-6]$/i.test(node[0].tagName)) {
      node.find('li').each((__, li) => parts.push(normalize($(li).text())));
      if (!node.find('li').length) parts.push(normalize(node.text()));
      node = node.next();
    }
    result = parts.filter(Boolean);
  });
  return [...new Set(result)];
}

const cleanPdfText = (value = '') => value
  .replace(/\r/g, '')
  .replace(/[ \t]+/g, ' ')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

function pdfSection(text, starts, ends) {
  const upper = text.toUpperCase();
  const startPositions = starts.map((label) => upper.indexOf(label)).filter((position) => position >= 0);
  if (!startPositions.length) return '';
  const start = Math.min(...startPositions);
  const afterHeading = text.indexOf('\n', start);
  const contentStart = afterHeading >= 0 ? afterHeading + 1 : start;
  const endPositions = ends.map((label) => upper.indexOf(label, contentStart)).filter((position) => position > contentStart);
  return cleanPdfText(text.slice(contentStart, endPositions.length ? Math.min(...endPositions) : contentStart + 4000));
}

function sectionList(section, limit = 10) {
  if (!section) return [];
  const blocks = section.split(/\n(?=(?:\d+[.)]|[a-z][.)]|[•✓]|[A-Z][A-Z ]{4,}:?))/).map(cleanPdfText).filter(Boolean);
  return blocks.slice(0, limit).map((item) => item.slice(0, 900));
}

function extractBrochureData(rawText) {
  const text = cleanPdfText(rawText);
  const introMatch = text.match(/LIC(?:’|'|‘)?s\s+[^\n]{2,120}\s+is\s+(?:a|an)\s+[\s\S]{20,900}?(?=\n\s*(?:BENEFITS?|1\.|ELIGIBILITY|FEATURES?))/i);
  const description = cleanPdfText(introMatch?.[0] || '');
  const benefitsText = pdfSection(text, ['BENEFITS:', 'BENEFITS\n', 'BENEFIT PAYABLE'], ['ELIGIBILITY CONDITIONS', 'ELIGIBILITY:', 'OPTIONAL BENEFITS', 'PREMIUMS']);
  const eligibilityText = pdfSection(text, ['ELIGIBILITY CONDITIONS', 'ELIGIBILITY:'], ['MODE OF PREMIUM', 'PREMIUM PAYMENT', 'REBATES', 'SAMPLE PREMIUM', 'BENEFITS']);
  const premiumText = pdfSection(text, ['PREMIUM PAYMENT', 'MODE OF PREMIUM PAYMENT', 'PREMIUMS:'], ['GRACE PERIOD', 'REBATES', 'REVIVAL', 'LOAN', 'TAX']);
  const documentText = pdfSection(text, ['DOCUMENTS REQUIRED', 'REQUIRED DOCUMENTS'], ['BENEFITS', 'PREMIUM', 'CLAIM']);
  const ageParts = [];
  for (const pattern of [
    /Minimum Age at Entry\s*:?\s*[^\n]{0,100}/ig,
    /Maximum Age at Entry\s*:?\s*[^\n]{0,100}/ig,
    /Minimum Age at Maturity\s*:?\s*[^\n]{0,100}/ig,
    /Maximum Age at Maturity\s*:?\s*[^\n]{0,100}/ig,
  ]) for (const match of text.matchAll(pattern)) ageParts.push(cleanPdfText(match[0]));
  const termParts = [];
  for (const pattern of [/Policy Term\s*:?\s*[^\n]{0,180}/ig, /Premium Paying Term\s*:?\s*[^\n]{0,180}/ig]) {
    for (const match of text.matchAll(pattern)) termParts.push(cleanPdfText(match[0]));
  }
  const coverage = sectionList(benefitsText).filter((item) => /death|sum assured|cover|maturity|survival/i.test(item));
  return {
    ageRange: [...new Set(ageParts)].slice(0, 4).join(' | '),
    shortDescription: description.split(/(?<=[.!?])\s/)[0]?.slice(0, 350) || '',
    description: description.slice(0, 1800),
    benefits: sectionList(benefitsText),
    eligibility: sectionList(eligibilityText),
    coverage: coverage.slice(0, 8),
    premiumInfo: premiumText.slice(0, 1800),
    policyTerm: [...new Set(termParts)].slice(0, 8).join('\n'),
    documents: sectionList(documentText, 8),
  };
}

export const getLicProductDetails = async (req, res) => {
  try {
    const requested = new URL(req.query.url);
    if (!['licindia.in', 'www.licindia.in'].includes(requested.hostname)) return sendError(res, 'Only official LIC URLs are allowed', 400);
    const html = await fetchLicPage(requested.href);
    const $ = cheerio.load(html);
    const brochureAnchor = $('a[href]').filter((_, anchor) => /sales\s*brochure/i.test(normalize($(anchor).text()))).first();
    const brochureUrl = absoluteLicUrl(brochureAnchor.attr('href'), '');
    let brochureData = {};
    if (brochureUrl) brochureData = extractBrochureData(await fetchLicPdf(brochureUrl));
    $('script,style,noscript,nav,footer').remove();
    const pageText = normalize($('main').text() || $('body').text());
    const ageMatch = pageText.match(/(?:minimum|maximum)?\s*(?:entry\s*)?age[^.]{0,80}(?:\d{1,3})[^.]{0,30}(?:year|yr)/i);
    const description = normalize($('meta[name="description"]').attr('content') || $('h1').first().next('p').text());
    const htmlData = {
      ageRange: ageMatch ? normalize(ageMatch[0]) : '',
      shortDescription: description,
      description,
      benefits: sectionItems($, ['benefit', 'feature']),
      eligibility: sectionItems($, ['eligibility', 'eligible']),
      coverage: sectionItems($, ['coverage', 'cover']),
      premiumInfo: sectionItems($, ['premium']).join('\n'),
      policyTerm: sectionItems($, ['policy term']).join('\n'),
      documents: sectionItems($, ['document']).filter((item) => !/^download/i.test(item)),
      imageUrl: absoluteLicUrl($('meta[property="og:image"]').attr('content'), ''),
      officialUrl: requested.href,
    };
    const data = { ...htmlData, ...Object.fromEntries(Object.entries(brochureData).filter(([, value]) => Array.isArray(value) ? value.length : value)), brochureUrl };
    return sendSuccess(res, 'Official LIC product details fetched', data);
  } catch (error) {
    return sendError(res, 'Unable to fetch product details from the official LIC website', 502, error.message);
  }
};
