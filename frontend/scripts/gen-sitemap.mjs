// Writes public/sitemap.xml for search engines: the public pages plus each Buying Tips article. It runs before every build (npm "prebuild").
// Ads are not listed here: search engines find them from the category pages. Pages that are hidden for now (see src/lib/hiddenCategories.js) are left out.
import { writeFileSync } from 'node:fs';
import { buyingArticles } from '../src/data/buyingArticles.js';
import { HIDDEN_ROUTES } from '../src/lib/hiddenCategories.js';

const ORIGIN = 'https://automax.ie';
const pages = [
  '/', '/cars-for-sale', '/electric-hybrid-cars', '/dealership-cars', '/vintage-cars', '/modified-cars', '/car-parts', '/car-extras', '/rally-cars', '/breaking-repairables',
  '/commercials', '/trucks', '/trailers', '/campers', '/coaches-buses', '/plant-machinery', '/caravans',
  '/motorbikes', '/motorbike-extras', '/vintage-bikes', '/scooters', '/quads', '/bikes-bicycles', '/boats', '/boat-extras', '/other-motor',
  '/dealers-garage', '/dealers-information', '/dealership-information', '/history-checks',
  '/buying-tips', '/selling-tips', '/how-to-sell-my-car',
  '/about-us', '/contact-us', '/help', '/advertisement', '/career', '/reviews-gallery', '/create-account',
  '/terms-and-conditions', '/privacy-policy', '/cookie-policy', '/accessibility',
  ...Object.keys(buyingArticles).map((slug) => `/buying-tips/article/${slug}`),
].filter((p) => !HIDDEN_ROUTES.includes(p));

const today = new Date().toISOString().slice(0, 10);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((p) => `  <url><loc>${ORIGIN}${p}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`;
writeFileSync(new URL('../public/sitemap.xml', import.meta.url), xml);
console.log(`sitemap.xml: ${pages.length} pages`);
