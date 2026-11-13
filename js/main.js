// Public site: builds the shared header/footer and each page from SiteData.
document.addEventListener('DOMContentLoaded', function () {
  var SD = window.SiteData;
  var esc = SD.esc, nl2br = SD.nl2br;
  var data = SD.get();
  var site = data.site, st = data.settings, cats = data.categories;
  var page = document.body.getAttribute('data-page') || '';
  var catById = {};
  cats.forEach(function (c) { catById[c.id] = c; });

  function $(id) { return document.getElementById(id); }
  function setText(id, v) { var el = $(id); if (el) el.textContent = v || ''; }

  // ---------- Document title ----------
  var pageNames = { shop: data.shop.title, about: data.about.title, contact: data.contact.title };
  if (page === 'home') document.title = site.businessName + ' | ' + site.tagline;
  else if (pageNames[page]) document.title = pageNames[page] + ' | ' + site.businessName;

  // ---------- Header, nav, footer ----------
  function renderHeader() {
    var host = $('siteHeader');
    if (!host) return;
    var options = '<option value="">All Categories</option>' + cats.map(function (c) {
      return '<option value="' + esc(c.id) + '">' + esc(c.label) + '</option>';
    }).join('');
    var navLinks = '<a href="shop.html" data-nav="shop">Shop</a>' +
      '<a href="about.html" data-nav="about">About</a><a href="contact.html" data-nav="contact">Contact</a>';

    var preview = SD.hasDraft()
      ? '<div class="preview-bar"><span>Preview: you are seeing unpublished admin edits saved in this browser only.</span>' +
        '<a href="admin/index.html">Open admin</a><button type="button" id="discardDraft">Discard edits</button></div>'
      : '';

    host.innerHTML = preview +
      '<div class="topbar"><div class="container topbar-inner">' +
        '<span>' + esc(site.topbar) + '</span>' +
        '<span><a href="' + esc(SD.telHref(site.phone)) + '">' + esc(site.phone) + '</a> · <a href="mailto:' + esc(site.email) + '">' + esc(site.email) + '</a></span>' +
      '</div></div>' +
      '<header class="header">' +
        '<div class="container header-main">' +
          '<a href="index.html" class="logo" aria-label="' + esc(site.businessName) + '"><img src="images/logo.svg" alt="' + esc(site.businessName) + '" class="logo-img"></a>' +
          '<form class="search-bar" id="searchForm" action="shop.html" method="get" role="search">' +
            '<input type="search" name="q" placeholder="Search products…" aria-label="Search products">' +
            '<select name="cat" aria-label="Category">' + options + '</select>' +
            '<button type="submit">Search</button>' +
          '</form>' +
          '<div class="header-actions"><a href="contact.html" class="header-link">Enquiry</a><a href="shop.html" class="btn btn-sm btn-primary">Shop</a></div>' +
        '</div>' +
        '<nav class="cat-nav" aria-label="Main"><div class="container cat-nav-bar">' +
          '<button type="button" class="menu-toggle" id="menuToggle" aria-label="Menu" aria-expanded="false" aria-controls="catNav">☰ Menu</button>' +
          '<div class="cat-nav-inner" id="catNav">' + navLinks + '</div>' +
        '</div></nav>' +
      '</header>';

    var toggle = $('menuToggle'), nav = $('catNav');
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    });

    var discard = $('discardDraft');
    if (discard) discard.addEventListener('click', function () {
      if (confirm('Discard the unpublished edits saved in this browser and show the published site?')) {
        SD.clearDraft();
        location.reload();
      }
    });

    if (page === 'about' || page === 'contact') {
      var link = host.querySelector('[data-nav="' + page + '"]');
      if (link) link.classList.add('active');
    }
  }

  function renderFooter() {
    var host = $('siteFooter');
    if (!host) return;
    var shopLinks = '<a href="shop.html">All Products</a>' + cats.map(function (c) {
      return '<a href="shop.html#' + esc(c.id) + '">' + esc(c.label) + '</a>';
    }).join('');
    host.innerHTML =
      '<footer class="footer">' +
        '<div class="container footer-grid">' +
          '<div class="footer-brand"><a href="index.html" class="logo" aria-label="' + esc(site.businessName) + '"><img src="images/logo.svg" alt="' + esc(site.businessName) + '" class="logo-img"></a>' +
            '<p>' + esc(site.footerBlurb) + '</p></div>' +
          '<div class="footer-links"><h4>Shop</h4>' + shopLinks + '<h4 style="margin-top:1rem">Company</h4><a href="about.html">About</a><a href="contact.html">Contact</a></div>' +
          '<div class="footer-contact"><h4>Visit Us</h4>' +
            '<p>' + nl2br(site.address) + '</p>' +
            '<p><a href="' + esc(SD.telHref(site.phone)) + '">' + esc(site.phone) + '</a><br><a href="mailto:' + esc(site.email) + '">' + esc(site.email) + '</a></p>' +
            '<p>' + nl2br(site.hours) + '</p></div>' +
        '</div>' +
        '<div class="container footer-bottom"><p>© ' + new Date().getFullYear() + ' ' + esc(site.businessName) + '. All rights reserved.</p>' +
          '<p class="admin-link"><a href="admin/index.html">Admin</a></p></div>' +
      '</footer>';
  }

  // ---------- Images ----------
  function applySlot(name, cls, alt) {
    var shown = false;
    document.querySelectorAll('[data-slot="' + name + '"]').forEach(function (el) {
      var src = data.images[name];
      if (src) {
        el.className = 'site-image ' + cls;
        el.innerHTML = '<img src="' + esc(src) + '" alt="' + esc(alt) + '">';
        shown = true;
      } else if (st.showImagePlaceholders) {
        shown = true;
      } else {
        el.style.display = 'none';
      }
    });
    return shown;
  }

  // ---------- Products ----------
  function formatPrice(price) { return st.currency + Number(price).toFixed(2); }

  function visibleProducts() {
    return data.products.filter(function (p) { return p.visible && (st.showSoldOut || p.inStock); });
  }

  function createProductCard(p) {
    var card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.category = p.category;
    var badge = p.inStock ? '' : '<span class="product-badge soldout">Currently unavailable</span>';
    var img = p.image
      ? '<img src="' + esc(p.image) + '" alt="' + esc(p.name) + '" loading="lazy">'
      : '<span style="opacity:0.55">Product photo<br><small>coming soon</small></span>';
    var cat = catById[p.category] ? catById[p.category].label : p.category;
    card.innerHTML =
      '<div class="product-image' + (p.image ? ' has-img' : '') + '">' + badge + img + '</div>' +
      '<div class="product-body">' +
        '<div class="product-cat">' + esc(cat) + '</div>' +
        '<h3 class="product-title">' + esc(p.name) + '</h3>' +
        '<p class="product-desc">' + esc(p.description) + '</p>' +
        '<div class="product-footer"><div class="product-price">' + esc(formatPrice(p.price)) +
          (st.priceNote ? '<small>' + esc(st.priceNote) + '</small>' : '') + '</div></div>' +
      '</div>';
    return card;
  }

  // ---------- Home ----------
  function renderHome() {
    setText('heroTitle', data.hero.headline);
    setText('heroLead', data.hero.lead);
    setText('heroPrimary', data.hero.primaryLabel);
    setText('heroSecondary', data.hero.secondaryLabel);
    var badges = $('heroBadges');
    if (badges) {
      badges.innerHTML = data.hero.badges.map(function (b) { return '<span class="hero-badge">' + esc(b) + '</span>'; }).join('');
      badges.style.display = data.hero.badges.length ? '' : 'none';
    }
    var heroShown = applySlot('hero', 'hero-photo', site.businessName);
    var inner = document.querySelector('.hero-promo-inner');
    if (inner && !heroShown) inner.classList.add('no-visual');

    var catCards = $('catCards');
    if (catCards) {
      catCards.innerHTML = cats.map(function (c) {
        return '<a href="shop.html#' + esc(c.id) + '" class="cat-card"><div class="cat-card-icon">' + esc(c.icon) + '</div><h3>' + esc(c.label) + '</h3><p>' + esc(c.blurb) + '</p></a>';
      }).join('');
      if (!cats.length) catCards.closest('section').style.display = 'none';
    }

    var grid = $('featuredProducts');
    if (grid) {
      var vis = visibleProducts();
      var featured = vis.filter(function (p) { return p.featured; }).slice(0, st.featuredCount);
      var list = featured.length ? featured : vis.slice(0, 4);
      if (!list.length) grid.innerHTML = '<p class="empty-state">Products will appear here soon.</p>';
      else list.forEach(function (p) { grid.appendChild(createProductCard(p)); });
    }

    var why = $('whyGrid');
    if (why) {
      why.innerHTML = data.why.map(function (w) {
        return '<div class="why-item"><strong>' + esc(w.title) + '</strong><span>' + esc(w.text) + '</span></div>';
      }).join('');
      if (!data.why.length) why.closest('section').style.display = 'none';
    }
    setText('ctaTitle', data.cta.title);
    setText('ctaText', data.cta.text);
    var phoneBtn = $('ctaPhone');
    if (phoneBtn) { phoneBtn.textContent = 'Call ' + site.phone; phoneBtn.href = SD.telHref(site.phone); }
  }

  // ---------- Shop ----------
  function renderShop() {
    setText('pageTitle', data.shop.title);
    setText('pageSub', data.shop.subtitle);
    var grid = $('productGrid'), tabs = $('filterTabs'), countEl = $('shopCount');
    if (!grid || !tabs) return;
    var all = visibleProducts();
    var searchForm = $('searchForm');

    tabs.innerHTML = '<button type="button" class="filter-btn" data-filter="">All</button>' + cats.map(function (c) {
      return '<button type="button" class="filter-btn" data-filter="' + esc(c.id) + '">' + esc(c.label) + '</button>';
    }).join('');

    function readState() {
      var p = new URLSearchParams(location.search);
      var hash = '';
      try { hash = decodeURIComponent((location.hash || '').replace(/^#/, '')); } catch (e) {}
      var cat = hash || p.get('cat') || '';
      if (cat && !catById[cat]) cat = '';
      return { cat: cat, q: (p.get('q') || '').trim() };
    }
    var state = readState();

    function syncUrl() {
      var url = location.pathname + (state.q ? '?q=' + encodeURIComponent(state.q) : '') + (state.cat ? '#' + encodeURIComponent(state.cat) : '');
      history.replaceState(null, '', url);
    }

    function render() {
      var words = state.q.toLowerCase().split(/\s+/).filter(Boolean);
      var list = all.filter(function (p) {
        if (state.cat && p.category !== state.cat) return false;
        if (!words.length) return true;
        var hay = (p.name + ' ' + p.description + ' ' + (catById[p.category] ? catById[p.category].label : '')).toLowerCase();
        return words.every(function (w) { return hay.indexOf(w) !== -1; });
      });
      grid.innerHTML = '';
      list.forEach(function (p) { grid.appendChild(createProductCard(p)); });
      if (!list.length) grid.innerHTML = '<p class="empty-state">No products found' + (state.q ? ' for “' + esc(state.q) + '”' : '') + '. Try another search or category.</p>';

      var text = list.length + (list.length === 1 ? ' product' : ' products');
      countEl.innerHTML = esc(text) + (state.q ? ' matching “' + esc(state.q) + '” · <a href="#" id="clearSearch">Clear search</a>' : '');
      var clear = $('clearSearch');
      if (clear) clear.addEventListener('click', function (e) { e.preventDefault(); state.q = ''; syncUrl(); render(); });

      tabs.querySelectorAll('.filter-btn').forEach(function (b) {
        var on = b.dataset.filter === state.cat;
        b.classList.toggle('active', on);
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var shopLink = document.querySelector('#catNav [data-nav="shop"]');
      if (shopLink) shopLink.classList.add('active');
      if (searchForm) { searchForm.elements.q.value = state.q; searchForm.elements.cat.value = state.cat; }
    }

    tabs.addEventListener('click', function (e) {
      var b = e.target.closest('.filter-btn');
      if (!b) return;
      state.cat = b.dataset.filter;
      syncUrl(); render();
    });
    if (searchForm) searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      state = { q: searchForm.elements.q.value.trim(), cat: searchForm.elements.cat.value };
      syncUrl(); render();
    });
    window.addEventListener('hashchange', function () { state = readState(); render(); });
    render();
  }

  // ---------- About ----------
  function renderAbout() {
    var a = data.about;
    setText('pageTitle', a.title);
    setText('pageSub', a.subtitle);
    setText('aboutHeading', a.heading);
    var body = $('aboutBody');
    if (body) body.innerHTML = a.paragraphs.map(function (p) { return '<p style="margin-bottom:1rem;color:var(--muted)">' + esc(p) + '</p>'; }).join('');
    setText('aboutOfferHeading', a.offerHeading);
    var offers = $('aboutOffers');
    if (offers) offers.innerHTML = a.offers.map(function (o) { return '<li>' + esc(o) + '</li>'; }).join('');
    if (!a.offers.length) { var oh = $('aboutOfferHeading'); if (oh) oh.style.display = 'none'; if (offers) offers.style.display = 'none'; }
    var shown = applySlot('about', 'about-photo', 'Our shop');
    var grid = document.querySelector('.about-grid');
    if (grid && !shown) grid.classList.add('single');
  }

  // ---------- Contact ----------
  function renderContact() {
    setText('pageTitle', data.contact.title);
    setText('pageSub', data.contact.subtitle);
    setText('formIntro', data.contact.formIntro);
    var addr = $('contactAddress'); if (addr) addr.innerHTML = nl2br(site.address);
    var hours = $('contactHours'); if (hours) hours.innerHTML = nl2br(site.hours);
    var pe = $('contactPhoneEmail');
    if (pe) pe.innerHTML =
      '<p><a href="' + esc(SD.telHref(site.phone)) + '" style="font-weight:600;color:var(--orange)">' + esc(site.phone) + '</a></p>' +
      '<p><a href="mailto:' + esc(site.email) + '" style="font-weight:600;color:var(--orange)">' + esc(site.email) + '</a></p>';
    applySlot('map', 'map', 'Shop location');

    var form = $('contactForm'), status = $('formStatus');
    if (!form) return;
    function say(msg, kind) { status.textContent = msg; status.className = 'form-status' + (kind ? ' ' + kind : ''); }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var payload = {};
      new FormData(form).forEach(function (v, k) { payload[k] = String(v).trim(); });
      var who = (payload.firstName + ' ' + payload.lastName).trim();
      var btn = form.querySelector('button[type="submit"]');

      if (st.formEndpoint) {
        say('Sending…');
        btn.disabled = true;
        fetch(st.formEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        }).then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          form.reset();
          say('Thank you – your message has been sent.', 'ok');
        }).catch(function () {
          say('Sorry, the message could not be sent. Please call ' + site.phone + ' or email ' + site.email + '.', 'error');
        }).then(function () { btn.disabled = false; });
        return;
      }

      // No form service configured: hand the message to the visitor's email app.
      var body = 'Name: ' + who + '\nEmail: ' + payload.email + '\nPhone: ' + (payload.phone || '-') + '\n\n' + payload.message;
      window.location.href = 'mailto:' + site.email + '?subject=' + encodeURIComponent('Website enquiry from ' + who) + '&body=' + encodeURIComponent(body);
      say('Your email app should open with the message ready to send. If nothing opens, please email ' + site.email + ' or call ' + site.phone + '.', 'ok');
    });
  }

  renderHeader();
  renderFooter();
  if (page === 'home') renderHome();
  if (page === 'shop') renderShop();
  if (page === 'about') renderAbout();
  if (page === 'contact') renderContact();
});
