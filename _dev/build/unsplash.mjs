// Fetches curated, editorial photographs from the official Unsplash API using
// the keys in ../../unsplash-api.txt and writes _dev/content/unsplash.json.
// All photos are landscape, bright/minimal/architectural or editorial studio imagery
// matching the Precision Digital Atelier visual identity.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');
const KEY_FILE = path.join(ROOT, 'unsplash-api.txt');
const OUT_FILE = path.join(ROOT, '_dev', 'content', 'unsplash.json');

function loadKeys() {
  const raw = fs.readFileSync(KEY_FILE, 'utf8');
  const keys = [];
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/UNSPLASH_API_KEY\d*\s*=\s*(.+)/);
    if (m && m[1].trim()) keys.push(m[1].trim());
  }
  if (!keys.length) throw new Error('No Unsplash API keys found in unsplash-api.txt');
  return keys;
}

const KEYS = loadKeys();
let keyIdx = 0;

async function searchUnsplash(query, perPage = 12) {
  for (let attempt = 0; attempt < KEYS.length; attempt++) {
    const key = KEYS[(keyIdx + attempt) % KEYS.length];
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high&per_page=${perPage}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${key}`,
        'Accept-Version': 'v1',
      },
    });
    if (res.ok) {
      keyIdx = (keyIdx + attempt) % KEYS.length;
      const data = await res.json();
      return data.results || [];
    }
    console.warn(`Key ${attempt} returned ${res.status} for "${query}"`);
  }
  throw new Error(`All Unsplash keys failed for query: ${query}`);
}

const QUERIES = [
  // Editorial / articles (6 articles x 2 photos = 12)
  { slot: 'article:how-to-merge-pdfs-in-your-browser:lead', query: 'stack of paper documents desk minimal white', fallbackAlt: 'Minimal stack of paper documents on a clean studio desk' },
  { slot: 'article:how-to-merge-pdfs-in-your-browser:inline', query: 'architectural binders archive shelves minimal', fallbackAlt: 'Organized archive binders aligned on studio shelving' },
  { slot: 'article:jpeg-quality-vs-dimensions:lead', query: 'camera lens optics macro minimal studio', fallbackAlt: 'Precision camera optics and photographic glass on a studio surface' },
  { slot: 'article:jpeg-quality-vs-dimensions:inline', query: 'color calibration print grid minimal desk', fallbackAlt: 'Print resolution test sheet and calibration tools on a light table' },
  { slot: 'article:merge-vs-portfolio-vs-attachment:lead', query: 'minimalist folders stationery flatlay paper', fallbackAlt: 'Document folders and paper sheets arranged in a structured flatlay' },
  { slot: 'article:merge-vs-portfolio-vs-attachment:inline', query: 'blueprint drafting ruler paper architecture', fallbackAlt: 'Architectural drafting tools and folded technical sheets' },
  { slot: 'article:pdf-compression-what-actually-shrinks:lead', query: 'white paper layers texture geometric minimal', fallbackAlt: 'Layered white paper sheets showing density and edge geometry' },
  { slot: 'article:pdf-compression-what-actually-shrinks:inline', query: 'modern office printer scanner minimal light', fallbackAlt: 'Clean document scanning and reproduction hardware in daylight' },
  { slot: 'article:text-pdfs-vs-scanned-pdfs:lead', query: 'typography book page macro print serif', fallbackAlt: 'Close-up of printed typography showing crisp letterforms on paper' },
  { slot: 'article:text-pdfs-vs-scanned-pdfs:inline', query: 'archival document magnifying glass desk', fallbackAlt: 'Inspecting printed document pages on an editorial worktable' },
  { slot: 'article:what-exif-metadata-reveals:lead', query: 'minimalist camera on white table studio', fallbackAlt: 'Digital camera resting on a clean white studio workbench' },
  { slot: 'article:what-exif-metadata-reveals:inline', query: 'topographic map compass minimal desk', fallbackAlt: 'Coordinate grid map and precision measuring instrument' },
  // Site sections (home editorial feature, about studio, methodology lab, categories)
  { slot: 'site:home-editorial', query: 'minimalist design studio desk paper daylight', fallbackAlt: 'Daylit editorial workbench with paper sheets and precision tools' },
  { slot: 'site:about-atelier', query: 'modern architecture concrete glass minimal daylight', fallbackAlt: 'Quiet architectural studio interior with natural light and clean lines' },
  { slot: 'site:methodology-lab', query: 'precision ruler drafting studio desk', fallbackAlt: 'Precision measuring instruments on a technical drafting surface' },
  { slot: 'site:cat-pdf', query: 'folded white paper geometric shadow minimal', fallbackAlt: 'Geometric composition of folded white document sheets' },
  { slot: 'site:cat-image', query: 'glass prism light refraction minimal white', fallbackAlt: 'Optical glass prism splitting light across a bright surface' },
  { slot: 'site:cat-color', query: 'color palette swatches design studio', fallbackAlt: 'Color swatch cards fanned across a neutral studio table' },
];

const usedIds = new Set();
const output = {};

for (const item of QUERIES) {
  const results = await searchUnsplash(item.query, 15);
  const pick = results.find((r) => !usedIds.has(r.id) && r.width >= 1200) || results[0];
  if (!pick) throw new Error(`No photo found for ${item.slot}`);
  usedIds.add(pick.id);
  const rawBase = pick.urls.raw.split('?')[0];
  output[item.slot] = {
    id: pick.id,
    url: `${rawBase}?auto=format&fit=crop&w=1400&q=78`,
    thumb: `${rawBase}?auto=format&fit=crop&w=720&q=74`,
    width: 1400,
    height: Math.round((pick.height / pick.width) * 1400),
    color: pick.color || '#E9F0FA',
    alt: pick.alt_description || pick.description || item.fallbackAlt,
    photographer: pick.user?.name || 'Unsplash Photographer',
    photographerUrl: `${pick.user?.links?.html || 'https://unsplash.com'}?utm_source=tooltutor&utm_medium=referral`,
    photoUrl: `${pick.links?.html || 'https://unsplash.com'}?utm_source=tooltutor&utm_medium=referral`,
  };
  console.log(`✓ ${item.slot} -> ${pick.id} (${output[item.slot].photographer})`);
}

fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2));
console.log(`Saved ${Object.keys(output).length} curated Unsplash photos to ${OUT_FILE}`);
