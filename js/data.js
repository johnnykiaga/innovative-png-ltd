// Data layer for the whole site (public pages + admin).
//
//  - js/content.js  = the PUBLISHED content (what visitors get)
//  - localStorage   = an optional DRAFT saved by the admin on this browser
//
// Everything that reads or writes site data goes through window.SiteData, so if
// you ever add a real database, this is the only file that has to change.
(function () {
  var KEY = 'innovativePngData';

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  // Turns an image path from the content into a usable URL. Embedded (data:)
  // images and full web addresses are left alone; relative paths such as
  // "images/hero.webp" get window.SITE_BASE in front (the admin sets it to "../").
  function img(src) {
    src = String(src || '');
    if (!src || /^(data:|https?:|blob:|\/)/i.test(src)) return src;
    return (window.SITE_BASE || '') + src;
  }
  function nl2br(s) { return esc(s).replace(/\r?\n/g, '<br>'); }
  function telHref(phone) { return 'tel:' + String(phone || '').replace(/[^\d+]/g, ''); }
  function isObj(v) { return v && typeof v === 'object' && !Array.isArray(v); }
  function str(v, fallback) { return typeof v === 'string' ? v : (fallback == null ? '' : fallback); }
  function strList(v, fallback) {
    return Array.isArray(v) ? v.map(function (x) { return str(x); }).filter(Boolean) : fallback.slice();
  }

  // Merge one object section over its defaults, keeping only known keys, in a
  // stable order (that is what lets us compare a draft with the published copy).
  function section(stored, def) {
    var out = {};
    Object.keys(def).forEach(function (k) {
      var d = def[k], s = isObj(stored) ? stored[k] : undefined;
      if (typeof d === 'string') out[k] = str(s, d);
      else if (typeof d === 'boolean') out[k] = typeof s === 'boolean' ? s : d;
      else if (typeof d === 'number') out[k] = typeof s === 'number' && isFinite(s) ? s : d;
      else if (Array.isArray(d)) out[k] = strList(s, d);
      else out[k] = s === undefined ? d : s;
    });
    return out;
  }

  function normalize(raw) {
    var def = window.SITE_CONTENT;
    var d = isObj(raw) ? raw : {};
    var out = {};
    out.site = section(d.site, def.site);
    out.settings = section(d.settings, def.settings);
    out.settings.featuredCount = Math.min(12, Math.max(1, Math.round(out.settings.featuredCount)));

    var cats = Array.isArray(d.categories) ? d.categories : def.categories;
    out.categories = cats.filter(isObj).map(function (c) {
      var id = str(c.id);
      return { id: id, label: str(c.label) || id, icon: str(c.icon), blurb: str(c.blurb) };
    }).filter(function (c) { return c.id; });

    out.hero = section(d.hero, def.hero);
    out.why = (Array.isArray(d.why) ? d.why : def.why).filter(isObj).map(function (w) {
      return { title: str(w.title), text: str(w.text) };
    }).filter(function (w) { return w.title || w.text; });
    out.cta = section(d.cta, def.cta);
    out.shop = section(d.shop, def.shop);
    out.about = section(d.about, def.about);
    out.contact = section(d.contact, def.contact);

    var im = isObj(d.images) ? d.images : {};
    out.images = {};
    Object.keys(def.images).forEach(function (k) {
      out.images[k] = typeof im[k] === 'string' && im[k] ? im[k] : null;
    });

    var prods = Array.isArray(d.products) ? d.products : def.products;
    var seen = {};
    out.products = [];
    prods.filter(isObj).forEach(function (p, i) {
      var id = Number(p.id);
      if (!isFinite(id) || id <= 0 || seen[id]) {
        id = out.products.reduce(function (m, x) { return Math.max(m, x.id); }, 0) + 1;
        while (seen[id]) id++;
      }
      seen[id] = true;
      var price = Number(p.price);
      out.products.push({
        id: id,
        name: str(p.name, 'Untitled product'),
        category: str(p.category),
        price: isFinite(price) && price >= 0 ? price : 0,
        description: str(p.description),
        image: typeof p.image === 'string' && p.image ? p.image : null,
        // Older saves had no "visible" flag and showed every product, so default to visible.
        visible: typeof p.visible === 'boolean' ? p.visible : true,
        inStock: typeof p.inStock === 'boolean' ? p.inStock : true,
        featured: !!p.featured
      });
    });
    return out;
  }

  function readStored() {
    try {
      var s = localStorage.getItem(KEY);
      return s ? JSON.parse(s) : null;
    } catch (e) { return null; }
  }

  function get() {
    var stored = readStored();
    return normalize(stored || clone(window.SITE_CONTENT));
  }

  // Returns { ok: true } or { ok: false, error: '...' }. Never throws.
  function save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(normalize(data)));
      return { ok: true };
    } catch (e) {
      var full = e && (e.name === 'QuotaExceededError' || e.code === 22 || e.code === 1014);
      return { ok: false, error: full ? 'The browser storage is full. Remove or shrink some photos and try again.' : 'Could not save in this browser (' + (e && e.message) + ').' };
    }
  }

  function hasDraft() {
    var stored = readStored();
    if (!stored) return false;
    return JSON.stringify(normalize(stored)) !== JSON.stringify(normalize(clone(window.SITE_CONTENT)));
  }

  function clearDraft() { try { localStorage.removeItem(KEY); } catch (e) {} }

  // The text of a new js/content.js file for the "Publish" button in the admin.
  function toContentJs(data) {
    return '// PUBLISHED SITE CONTENT – generated by the admin panel on ' + new Date().toISOString().slice(0, 10) + '.\n' +
      '// Replace js/content.js with this file to make these changes live for every visitor.\n' +
      'window.SITE_CONTENT = ' + JSON.stringify(normalize(data), null, 2) + ';\n';
  }

  // ---------- Live content (optional) ----------
  // If the Cloudflare Worker is deployed, the newest published content comes from
  // /api/content. If not (plain static hosting, file://, Worker down), the site
  // quietly uses js/content.js instead.
  var livePromise = null;
  function loadLive() {
    if (livePromise) return livePromise;
    livePromise = new Promise(function (resolve) {
      if (!window.fetch || location.protocol === 'file:') return resolve(false);
      var ctrl = window.AbortController ? new AbortController() : null;
      var timer = setTimeout(function () { if (ctrl) ctrl.abort(); resolve(false); }, 3000);
      fetch((window.SITE_BASE || '') + 'api/content', { signal: ctrl ? ctrl.signal : undefined, headers: { Accept: 'application/json' } })
        .then(function (r) { if (!r.ok) throw new Error('no live content'); return r.json(); })
        .then(function (j) {
          clearTimeout(timer);
          if (j && Array.isArray(j.products) && j.site) { window.SITE_CONTENT = j; resolve(true); } else resolve(false);
        })
        .catch(function () { clearTimeout(timer); resolve(false); });
    });
    return livePromise;
  }
  var domReady = new Promise(function (resolve) {
    if (document.readyState !== 'loading') resolve();
    else document.addEventListener('DOMContentLoaded', resolve);
  });
  // Runs fn once the page is ready AND the live content (if any) has been fetched.
  function whenReady(fn) { Promise.all([domReady, loadLive()]).then(function () { fn(); }); }

  window.SiteData = {
    get: get, save: save, normalize: normalize, hasDraft: hasDraft, clearDraft: clearDraft,
    toContentJs: toContentJs, loadLive: loadLive, whenReady: whenReady, img: img, esc: esc, nl2br: nl2br, telHref: telHref,
    defaults: function () { return normalize(clone(window.SITE_CONTENT)); }
  };
})();
