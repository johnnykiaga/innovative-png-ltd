// Innovative PNG Ltd – tiny Cloudflare Worker.
//
//   GET  /api/content   public   the published site content (from KV)
//   PUT  /api/content   admin    publish new content (keeps the previous copy)
//   GET  /api/auth      admin    check the admin token works
//   POST /api/upload    admin    upload a photo to R2, returns its path
//   GET  /img/*         public   photos from R2
//   anything else       static files (HTML, CSS, JS, fonts, images/) – handled by Cloudflare
//
// "admin" = the request carries  Authorization: Bearer <ADMIN_TOKEN>.
// Bindings (see wrangler.toml): CONTENT (KV), PHOTOS (R2), ASSETS (static files).
// Secret: ADMIN_TOKEN  (wrangler secret put ADMIN_TOKEN)

const MAX_CONTENT_BYTES = 2 * 1024 * 1024;
const MAX_PHOTO_BYTES = 3 * 1024 * 1024;
const PHOTO_TYPES = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

function json(body, status = 200, extra = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

// Compare two strings without leaking where they differ.
async function safeEqual(a, b) {
  const enc = new TextEncoder();
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', enc.encode(a)),
    crypto.subtle.digest('SHA-256', enc.encode(b)),
  ]);
  const x = new Uint8Array(ha), y = new Uint8Array(hb);
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}

async function isAdmin(request, env) {
  if (!env.ADMIN_TOKEN || env.ADMIN_TOKEN.length < 12) return false; // refuse to run with a weak/missing token
  const header = request.headers.get('Authorization') || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  return !!m && (await safeEqual(m[1].trim(), env.ADMIN_TOKEN));
}

function looksLikeContent(c) {
  return c && typeof c === 'object' && !Array.isArray(c) &&
    c.site && typeof c.site === 'object' &&
    Array.isArray(c.products) && Array.isArray(c.categories);
}

async function handleContent(request, env) {
  if (request.method === 'GET' || request.method === 'HEAD') {
    const text = await env.CONTENT.get('content');
    if (!text) return json({ error: 'No published content yet' }, 404, { 'Cache-Control': 'no-store' });
    return new Response(request.method === 'HEAD' ? null : text, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // Short cache: edits show up within about a minute, and most visitors are served from the edge.
        'Cache-Control': 'public, max-age=15, stale-while-revalidate=60',
      },
    });
  }

  if (request.method === 'PUT') {
    if (!(await isAdmin(request, env))) return json({ error: 'Not allowed' }, 401);
    const text = await request.text();
    if (text.length > MAX_CONTENT_BYTES) return json({ error: 'Content is too large (max 2 MB).' }, 413);
    let parsed;
    try { parsed = JSON.parse(text); } catch (e) { return json({ error: 'That is not valid JSON.' }, 400); }
    if (!looksLikeContent(parsed)) return json({ error: 'That does not look like site content.' }, 400);
    const previous = await env.CONTENT.get('content');
    if (previous) await env.CONTENT.put('content:previous', previous);
    await env.CONTENT.put('content', JSON.stringify(parsed));
    return json({ ok: true, savedAt: new Date().toISOString() });
  }

  return json({ error: 'Method not allowed' }, 405, { Allow: 'GET, HEAD, PUT' });
}

async function handleAuth(request, env) {
  return (await isAdmin(request, env)) ? json({ ok: true }) : json({ error: 'Not allowed' }, 401);
}

async function handleUpload(request, env) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' });
  if (!(await isAdmin(request, env))) return json({ error: 'Not allowed' }, 401);
  const type = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  const ext = PHOTO_TYPES[type];
  if (!ext) return json({ error: 'Only WebP, JPEG or PNG photos.' }, 415);
  const body = await request.arrayBuffer();
  if (!body.byteLength) return json({ error: 'Empty file.' }, 400);
  if (body.byteLength > MAX_PHOTO_BYTES) return json({ error: 'Photo is too large (max 3 MB).' }, 413);
  const id = crypto.randomUUID().slice(0, 8);
  const key = 'uploads/' + Date.now().toString(36) + '-' + id + '.' + ext;
  await env.PHOTOS.put(key, body, { httpMetadata: { contentType: type } });
  // The site stores this relative path in the content.
  return json({ ok: true, path: 'img/' + key });
}

async function handlePhoto(request, env, url) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return json({ error: 'Method not allowed' }, 405);
  const key = decodeURIComponent(url.pathname.replace(/^\/img\//, ''));
  if (!key || key.includes('..')) return json({ error: 'Not found' }, 404);
  const obj = await env.PHOTOS.get(key);
  if (!obj) return json({ error: 'Not found' }, 404);
  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set('ETag', obj.httpEtag);
  // Uploaded file names are unique and never reused, so they can be cached for a long time.
  headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(request.method === 'HEAD' ? null : obj.body, { headers });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/content') return await handleContent(request, env);
      if (url.pathname === '/api/auth') return await handleAuth(request, env);
      if (url.pathname === '/api/upload') return await handleUpload(request, env);
      if (url.pathname.startsWith('/img/')) return await handlePhoto(request, env, url);
      if (url.pathname.startsWith('/api/')) return json({ error: 'Not found' }, 404);
    } catch (e) {
      return json({ error: 'Server error' }, 500);
    }
    return env.ASSETS.fetch(request);
  },
};
