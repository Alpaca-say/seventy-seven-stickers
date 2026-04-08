// ============================================================
//  sanity.js — Sanity CDN client (no npm needed, pure fetch)
//  Replace PROJECT_ID and DATASET with your actual values
// ============================================================

const SANITY_PROJECT_ID = 'YOUR_PROJECT_ID';   // <-- replace
const SANITY_DATASET    = 'production';         // or 'development'
const SANITY_API_VERSION = '2024-01-01';

/**
 * Run a GROQ query against your Sanity dataset
 * @param {string} query - GROQ query string
 * @returns {Promise<any>}
 */
async function sanityFetch(query) {
  const encoded = encodeURIComponent(query);
  const url = `https://${SANITY_PROJECT_ID}.api.sanity.io/v${SANITY_API_VERSION}/data/query/${SANITY_DATASET}?query=${encoded}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Sanity error: ${res.status}`);
  const data = await res.json();
  return data.result;
}

/**
 * Build a Sanity image URL from an asset reference
 * @param {object} imageRef - Sanity image asset object
 * @param {object} opts - { width, height, fit }
 * @returns {string} CDN image URL
 */
function sanityImageUrl(imageRef, opts = {}) {
  if (!imageRef || !imageRef.asset || !imageRef.asset._ref) return null;

  const ref = imageRef.asset._ref;
  // ref format: image-{id}-{width}x{height}-{format}
  const [, id, dimensions, fmt] = ref.split('-');
  const ext = fmt === 'jpg' ? 'jpg' : fmt;
  let url = `https://cdn.sanity.io/images/${SANITY_PROJECT_ID}/${SANITY_DATASET}/${id}-${dimensions}.${ext}`;

  const params = [];
  if (opts.width)  params.push(`w=${opts.width}`);
  if (opts.height) params.push(`h=${opts.height}`);
  if (opts.fit)    params.push(`fit=${opts.fit}`);
  if (params.length) url += '?' + params.join('&');

  return url;
}
