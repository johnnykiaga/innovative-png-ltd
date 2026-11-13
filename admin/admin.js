(function () {
  'use strict';

  var SD = window.SiteData;
  var esc = SD.esc;
  var DEFAULT_PASSWORD = 'innovative2024';
  var currentData = null, editingId = null, currentImageData = null;

  function $(id) { return document.getElementById(id); }

  // ---------- Password gate (a convenience lock only – not real security) ----------
  function getPassword() { try { return localStorage.getItem('ipng_admin_pass') || DEFAULT_PASSWORD; } catch (e) { return DEFAULT_PASSWORD; } }
  function setPassword(p) { localStorage.setItem('ipng_admin_pass', p); }
  function isLoggedIn() { try { return sessionStorage.getItem('ipng_admin') === '1'; } catch (e) { return false; } }
  function setLoggedIn(v) { try { if (v) sessionStorage.setItem('ipng_admin', '1'); else sessionStorage.removeItem('ipng_admin'); } catch (e) {} }

  var toastTimer;
  function toast(msg, isError) {
    var el = $('toast');
    el.textContent = msg;
    el.classList.toggle('error', !!isError);
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2600);
  }

  // Save currentData. On success currentData is re-read in its clean, normalized form.
  function persist(msg) {
    var r = SD.save(currentData);
    if (!r.ok) { alert(r.error); toast('Not saved', true); return false; }
    currentData = SD.get();
    if (msg) toast(msg);
    refreshStatus();
    return true;
  }
  // Run a change; if saving fails, roll back so the screen never lies about what is stored.
  function change(fn, msg) {
    var before = JSON.stringify(currentData);
    fn();
    if (!persist(msg)) { currentData = JSON.parse(before); return false; }
    return true;
  }

  // ---------- Login / logout ----------
  function showAdmin() {
    $('loginScreen').style.display = 'none';
    $('adminWrap').classList.add('active');
    currentData = SD.get();
    renderAll();
  }
  function showLogin() {
    $('loginScreen').style.display = 'flex';
    $('adminWrap').classList.remove('active');
    $('password').value = '';
  }
  $('loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    if ($('password').value === getPassword()) { setLoggedIn(true); $('loginError').classList.remove('show'); showAdmin(); }
    else $('loginError').classList.add('show');
  });
  $('logoutBtn').addEventListener('click', function () { setLoggedIn(false); showLogin(); });

  // ---------- Tabs ----------
  function openTab(name) {
    document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === name); });
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.toggle('active', p.id === 'panel-' + name); });
    if (name === 'pages') loadPageEditor();
    if (name === 'products') renderProducts();
    if (name === 'categories') renderCategories();
    if (name === 'site') loadBound($('panel-site'));
    if (name === 'settings') loadBound($('panel-settings'));
    if (name === 'publish') updatePublishInfo();
  }
  document.querySelectorAll('.tab-btn').forEach(function (btn) {
    btn.addEventListener('click', function () { openTab(btn.dataset.tab); });
  });

  // ---------- Status banners ----------
  function refreshStatus() {
    var draft = SD.hasDraft();
    var bar = $('statusBar');
    bar.className = 'status-bar ' + (draft ? 'draft' : 'clean');
    $('statusText').textContent = draft
      ? 'You have unpublished edits. They are saved in this browser only — visitors still see the published site.'
      : 'No unpublished edits. The site matches the published content.';
    $('statusPublish').style.display = draft ? '' : 'none';
    $('statusDiscard').style.display = draft ? '' : 'none';
    $('passWarn').style.display = getPassword() === DEFAULT_PASSWORD ? '' : 'none';
    $('brandName').textContent = currentData ? currentData.site.businessName : '';
    renderStats();
  }
  $('goChangePass').addEventListener('click', function () { openTab('settings'); $('curPass').focus(); });
  $('statusPublish').addEventListener('click', function () { openTab('publish'); });

  function renderStats() {
    var p = currentData.products;
    $('statTotal').textContent = p.length;
    $('statShown').textContent = p.filter(function (x) { return x.visible; }).length;
    $('statOut').textContent = p.filter(function (x) { return !x.inStock; }).length;
    $('statFeat').textContent = p.filter(function (x) { return x.featured; }).length;
  }

  function renderAll() {
    refreshStatus();
    loadPageEditor();
    fillCategorySelects();
    renderProducts();
    renderCategories();
    loadBound($('panel-site'));
    loadBound($('panel-settings'));
    updatePublishInfo();
  }

  // ---------- Generic text binding (data-bind="section.key") ----------
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? a : a[k]; }, o); }
  function setPath(o, p, v) {
    var ks = p.split('.'), t = o;
    ks.slice(0, -1).forEach(function (k) { if (typeof t[k] !== 'object' || t[k] === null) t[k] = {}; t = t[k]; });
    t[ks[ks.length - 1]] = v;
  }
  function lines(s) { return s.replace(/\r/g, '').split('\n').map(function (x) { return x.trim(); }).filter(Boolean); }
  var codecs = {
    text: { to: function (v) { return v == null ? '' : String(v); }, from: function (s) { return s.replace(/\r/g, '').trim(); } },
    lines: { to: function (a) { return (a || []).join('\n'); }, from: lines },
    paras: { to: function (a) { return (a || []).join('\n\n'); }, from: function (s) { return s.replace(/\r/g, '').split(/\n\s*\n/).map(function (x) { return x.trim(); }).filter(Boolean); } },
    csv: { to: function (a) { return (a || []).join(', '); }, from: function (s) { return s.split(',').map(function (x) { return x.trim(); }).filter(Boolean); } },
    pairs: {
      to: function (a) { return (a || []).map(function (x) { return x.title + ' | ' + x.text; }).join('\n'); },
      from: function (s) {
        return lines(s).map(function (l) {
          var i = l.indexOf('|');
          return i < 0 ? { title: l, text: '' } : { title: l.slice(0, i).trim(), text: l.slice(i + 1).trim() };
        });
      }
    }
  };
  function loadBound(scope) {
    scope.querySelectorAll('[data-bind]').forEach(function (el) {
      var v = getPath(currentData, el.getAttribute('data-bind')), type = el.getAttribute('data-type') || 'text';
      if (type === 'bool') el.checked = !!v;
      else if (type === 'num') el.value = v == null ? '' : v;
      else el.value = codecs[type].to(v);
    });
  }
  function saveBound(scope) {
    scope.querySelectorAll('[data-bind]').forEach(function (el) {
      var type = el.getAttribute('data-type') || 'text', path = el.getAttribute('data-bind');
      if (type === 'bool') setPath(currentData, path, el.checked);
      else if (type === 'num') { var n = parseFloat(el.value); if (isFinite(n)) setPath(currentData, path, n); }
      else setPath(currentData, path, codecs[type].from(el.value));
    });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-save]');
    if (!b) return;
    var scope = b.closest('[data-scope]');
    var panel = b.closest('.panel');
    var ok = change(function () { saveBound(scope); }, b.getAttribute('data-save'));
    if (ok) {
      loadBound(panel);
      renderPreview();
      fillCategorySelects();
    }
  });

  // ---------- Page editor ----------
  function renderPreview() {
    var s = currentData.site;
    $('ppTopLeft').textContent = s.topbar;
    $('ppTopRight').textContent = s.phone;
    $('ppNav').innerHTML = '<span>Shop</span><span>About</span><span>Contact</span>';
    $('ppCats').innerHTML = currentData.categories.length
      ? currentData.categories.map(function (c) { return '<div class="pp-cat"><strong>' + esc(c.icon) + ' ' + esc(c.label) + '</strong>' + esc(c.blurb) + '</div>'; }).join('')
      : '<p class="empty" style="grid-column:1/-1">No categories yet</p>';

    var box = $('ppFeatured');
    var shown = currentData.products.filter(function (p) { return p.visible; });
    var featured = shown.filter(function (p) { return p.featured; }).slice(0, 4);
    var list = featured.length ? featured : shown.slice(0, 4);
    box.innerHTML = '';
    if (!list.length) { box.innerHTML = '<p class="empty" style="grid-column:1/-1">No visible products yet</p>'; return; }
    list.forEach(function (p) {
      var d = document.createElement('div');
      d.className = 'pp-prod';
      d.innerHTML = '<div class="pp-prod-img">' + (p.image ? '<img src="' + esc(p.image) + '" alt="">' : 'No photo') + '</div><div class="pp-prod-body"><strong>' + esc(p.name) + '</strong><span>' + esc(currentData.settings.currency + Number(p.price).toFixed(2)) + '</span></div>';
      box.appendChild(d);
    });
  }

  function loadPageEditor() {
    loadBound($('panel-pages'));
    renderPreview();
    setSlotImage($('slotHero'), currentData.images.hero);
    setSlotImage($('slotAbout'), currentData.images.about);
    setSlotImage($('slotMap'), currentData.images.map);
  }

  function setSlotImage(slotEl, dataUrl) {
    var img = slotEl.querySelector('img');
    if (dataUrl) {
      slotEl.classList.add('has-image');
      if (!img) { img = document.createElement('img'); img.alt = ''; slotEl.appendChild(img); }
      img.src = dataUrl;
    } else {
      slotEl.classList.remove('has-image');
      if (img) img.remove();
    }
  }

  function bindSlot(slotId, fileId, key, clearId) {
    var slot = $(slotId), file = $(fileId);
    slot.addEventListener('click', function () { file.click(); });
    file.addEventListener('change', function (e) {
      var f = e.target.files[0];
      if (!f) return;
      if (f.size > 2 * 1024 * 1024) { alert('Please use an image under 2 MB.'); file.value = ''; return; }
      var reader = new FileReader();
      reader.onload = function (ev) {
        if (change(function () { currentData.images[key] = ev.target.result; }, 'Image saved')) setSlotImage(slot, currentData.images[key]);
        file.value = '';
      };
      reader.readAsDataURL(f);
    });
    $(clearId).addEventListener('click', function (e) {
      e.stopPropagation();
      if (change(function () { currentData.images[key] = null; }, 'Image removed')) setSlotImage(slot, null);
      file.value = '';
    });
  }
  bindSlot('slotHero', 'fileHero', 'hero', 'clearHero');
  bindSlot('slotAbout', 'fileAbout', 'about', 'clearAbout');
  bindSlot('slotMap', 'fileMap', 'map', 'clearMap');

  // ---------- Categories ----------
  function categoryLabel(id) {
    var c = currentData.categories.filter(function (x) { return x.id === id; })[0];
    return c ? c.label : null;
  }
  function productCount(id) { return currentData.products.filter(function (p) { return p.category === id; }).length; }
  function slugify(label) {
    var base = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'category';
    var id = base, n = 2;
    while (currentData.categories.some(function (c) { return c.id === id; })) id = base + '-' + n++;
    return id;
  }

  function renderCategories() {
    var host = $('catList');
    if (!currentData.categories.length) { host.innerHTML = '<p class="empty">No categories yet. Add one to start organising products.</p>'; return; }
    host.innerHTML = currentData.categories.map(function (c, i) {
      var n = productCount(c.id);
      return '<div class="cat-row" data-i="' + i + '">' +
        '<input class="cat-icon" maxlength="4" value="' + esc(c.icon) + '" aria-label="Icon (emoji)">' +
        '<input class="cat-label" value="' + esc(c.label) + '" aria-label="Category name">' +
        '<input class="cat-blurb" value="' + esc(c.blurb) + '" aria-label="Short description" placeholder="Short description for the home-page card">' +
        '<span class="cat-meta"><code>' + esc(c.id) + '</code> · ' + n + (n === 1 ? ' product' : ' products') + '</span>' +
        '<div class="row-actions">' +
          '<button type="button" class="btn btn-secondary btn-sm" data-cat-act="up" ' + (i === 0 ? 'disabled' : '') + ' aria-label="Move up">↑</button>' +
          '<button type="button" class="btn btn-secondary btn-sm" data-cat-act="down" ' + (i === currentData.categories.length - 1 ? 'disabled' : '') + ' aria-label="Move down">↓</button>' +
          '<button type="button" class="btn btn-danger btn-sm" data-cat-act="del">Delete</button>' +
        '</div></div>';
    }).join('');
  }

  // Copy what is typed in the rows into currentData (no saving yet).
  function collectCategories() {
    document.querySelectorAll('#catList .cat-row').forEach(function (row) {
      var c = currentData.categories[+row.dataset.i];
      if (!c) return;
      c.icon = row.querySelector('.cat-icon').value.trim();
      c.label = row.querySelector('.cat-label').value.trim();
      c.blurb = row.querySelector('.cat-blurb').value.trim();
    });
  }
  function categoriesValid() {
    var bad = currentData.categories.some(function (c) { return !c.label; });
    if (bad) alert('Every category needs a name.');
    return !bad;
  }

  $('addCategoryBtn').addEventListener('click', function () {
    collectCategories();
    if (!categoriesValid()) return;
    var name = prompt('Name of the new category?');
    if (!name || !name.trim()) return;
    name = name.trim();
    if (change(function () { currentData.categories.push({ id: slugify(name), label: name, icon: '🏷️', blurb: '' }); }, 'Category added')) {
      renderCategories(); fillCategorySelects(); renderPreview();
    }
  });
  $('saveCategoriesBtn').addEventListener('click', function () {
    var before = JSON.stringify(currentData);
    collectCategories();
    if (!categoriesValid()) { currentData = JSON.parse(before); return; }
    if (persist('Categories saved')) { renderCategories(); fillCategorySelects(); renderPreview(); }
    else currentData = JSON.parse(before);
  });
  $('catList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-cat-act]');
    if (!btn) return;
    var i = +btn.closest('.cat-row').dataset.i, act = btn.getAttribute('data-cat-act');
    collectCategories();
    if (!categoriesValid()) return;
    if (act === 'del') {
      var c = currentData.categories[i], n = productCount(c.id);
      if (n) { alert('“' + c.label + '” still has ' + n + (n === 1 ? ' product' : ' products') + '. Move or delete them first (Products tab).'); renderCategories(); return; }
      if (!confirm('Delete the category “' + c.label + '”?')) { renderCategories(); return; }
      if (!change(function () { currentData.categories.splice(i, 1); }, 'Category deleted')) { renderCategories(); return; }
    } else {
      var j = act === 'up' ? i - 1 : i + 1;
      if (j < 0 || j >= currentData.categories.length) return;
      change(function () { var t = currentData.categories[i]; currentData.categories[i] = currentData.categories[j]; currentData.categories[j] = t; });
    }
    renderCategories(); fillCategorySelects(); renderPreview();
  });

  function fillCategorySelects() {
    var cats = currentData.categories;
    var filter = $('filterCategory'), prev = filter.value;
    filter.innerHTML = '<option value="">All categories</option>' + cats.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.label) + '</option>'; }).join('');
    filter.value = cats.some(function (c) { return c.id === prev; }) ? prev : '';
    $('prodCategory').innerHTML = cats.map(function (c) { return '<option value="' + esc(c.id) + '">' + esc(c.label) + '</option>'; }).join('');
  }

  // ---------- Products ----------
  function filtersActive() {
    return !!($('searchProducts').value.trim() || $('filterCategory').value || $('filterVisible').value || $('filterStock').value);
  }
  function getFilteredProducts() {
    var list = currentData.products.slice();
    var q = $('searchProducts').value.toLowerCase().trim();
    var cat = $('filterCategory').value, vis = $('filterVisible').value, stock = $('filterStock').value, sort = $('sortProducts').value;
    if (q) list = list.filter(function (p) { return p.name.toLowerCase().indexOf(q) !== -1 || p.description.toLowerCase().indexOf(q) !== -1; });
    if (cat) list = list.filter(function (p) { return p.category === cat; });
    if (vis === 'yes') list = list.filter(function (p) { return p.visible; });
    if (vis === 'no') list = list.filter(function (p) { return !p.visible; });
    if (stock === 'in') list = list.filter(function (p) { return p.inStock; });
    if (stock === 'out') list = list.filter(function (p) { return !p.inStock; });
    if (sort === 'name') list.sort(function (a, b) { return a.name.localeCompare(b.name); });
    if (sort === 'price-asc') list.sort(function (a, b) { return a.price - b.price; });
    if (sort === 'price-desc') list.sort(function (a, b) { return b.price - a.price; });
    if (sort === 'newest') list.sort(function (a, b) { return b.id - a.id; });
    return list;
  }

  function renderProducts() {
    var host = $('productList');
    var products = getFilteredProducts();
    var canReorder = $('sortProducts').value === 'manual' && !filtersActive();
    $('orderHint').textContent = canReorder
      ? 'The ↑ ↓ buttons change the order products appear in on the shop page.'
      : 'To reorder products, set Sort to “Shop order (manual)” and clear the filters.';
    renderStats();
    if (!products.length) {
      host.innerHTML = '<p class="empty">' + (currentData.products.length ? 'No products match these filters.' : 'No products yet. Add one to showcase.') + '</p>';
      return;
    }
    var cur = currentData.settings.currency;
    host.innerHTML = products.map(function (p, idx) {
      var label = categoryLabel(p.category);
      var catHtml = label ? esc(label) : '<span class="nocat">no category</span>';
      var thumb = p.image ? '<img src="' + esc(p.image) + '" alt="">' : 'No photo';
      var badges = '<span class="badge ' + (p.visible ? '' : 'off') + '">' + (p.visible ? 'Visible' : 'Hidden') + '</span>' +
        '<span class="badge ' + (p.inStock ? '' : 'out') + '">' + (p.inStock ? 'In stock' : 'Out of stock') + '</span>' +
        (p.featured ? '<span class="badge feat">Featured</span>' : '');
      var pos = currentData.products.indexOf(p);
      return '<div class="product-row" data-id="' + p.id + '">' +
        '<div class="product-thumb">' + thumb + '</div>' +
        '<div class="product-info"><h3>' + esc(p.name) + '</h3><p>' + esc(cur + Number(p.price).toFixed(2)) + ' · ' + catHtml + '</p></div>' +
        '<div class="badges">' + badges + '</div>' +
        '<div class="row-actions">' +
          (canReorder ? '<button class="btn btn-secondary btn-sm" data-act="up" aria-label="Move up" ' + (pos === 0 ? 'disabled' : '') + '>↑</button><button class="btn btn-secondary btn-sm" data-act="down" aria-label="Move down" ' + (pos === currentData.products.length - 1 ? 'disabled' : '') + '>↓</button>' : '') +
          '<button class="btn btn-secondary btn-sm" data-act="feat" title="Toggle featured">' + (p.featured ? '★' : '☆') + '</button>' +
          '<button class="btn btn-secondary btn-sm" data-act="edit">Edit</button>' +
          '<button class="btn btn-secondary btn-sm" data-act="dup">Copy</button>' +
          '<button class="btn btn-secondary btn-sm" data-act="vis">' + (p.visible ? 'Hide' : 'Show') + '</button>' +
          '<button class="btn btn-secondary btn-sm" data-act="stock">' + (p.inStock ? 'Mark out' : 'Mark in') + '</button>' +
          '<button class="btn btn-danger btn-sm" data-act="del">Delete</button>' +
        '</div></div>';
    }).join('');
  }

  $('productList').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-act]');
    if (!btn || btn.disabled) return;
    var id = +btn.closest('.product-row').dataset.id, act = btn.getAttribute('data-act');
    var idx = currentData.products.findIndex(function (p) { return p.id === id; });
    if (idx < 0) return;
    var ok = false;
    if (act === 'edit') { openModal(id); return; }
    if (act === 'del') {
      if (!confirm('Delete “' + currentData.products[idx].name + '”?')) return;
      ok = change(function () { currentData.products.splice(idx, 1); }, 'Deleted');
    } else if (act === 'dup') {
      ok = change(function () {
        var copy = JSON.parse(JSON.stringify(currentData.products[idx]));
        copy.id = currentData.products.reduce(function (m, p) { return Math.max(m, p.id); }, 0) + 1;
        copy.name += ' (copy)';
        currentData.products.splice(idx + 1, 0, copy);
      }, 'Duplicated');
    } else if (act === 'vis') {
      ok = change(function () { currentData.products[idx].visible = !currentData.products[idx].visible; }, currentData.products[idx].visible ? 'Hidden from site' : 'Now visible');
    } else if (act === 'stock') {
      ok = change(function () { currentData.products[idx].inStock = !currentData.products[idx].inStock; }, 'Stock updated');
    } else if (act === 'feat') {
      ok = change(function () { currentData.products[idx].featured = !currentData.products[idx].featured; }, 'Featured updated');
    } else if (act === 'up' || act === 'down') {
      var j = act === 'up' ? idx - 1 : idx + 1;
      if (j < 0 || j >= currentData.products.length) return;
      ok = change(function () { var t = currentData.products[idx]; currentData.products[idx] = currentData.products[j]; currentData.products[j] = t; }, 'Order updated');
    }
    if (ok) { renderProducts(); renderPreview(); renderCategories(); }
    else renderProducts();
  });

  ['searchProducts', 'filterCategory', 'filterVisible', 'filterStock', 'sortProducts'].forEach(function (id) {
    $(id).addEventListener('input', renderProducts);
    $(id).addEventListener('change', renderProducts);
  });

  // ---------- Product editor modal ----------
  function openModal(id) {
    if (!currentData.categories.length) { alert('Add a category first (Categories tab), then you can add products.'); return; }
    editingId = id || null;
    currentImageData = null;
    fillCategorySelects();
    var preview = $('imagePreview'), removeBtn = $('removeImageBtn');
    $('prodImage').value = '';
    if (id) {
      var p = currentData.products.filter(function (x) { return x.id === id; })[0];
      $('modalTitle').textContent = 'Edit Product';
      $('productId').value = p.id;
      $('prodName').value = p.name;
      if (!categoryLabel(p.category)) {
        var opt = document.createElement('option'); opt.value = p.category; opt.textContent = '(no category)'; $('prodCategory').insertBefore(opt, $('prodCategory').firstChild);
      }
      $('prodCategory').value = p.category;
      $('prodPrice').value = p.price;
      $('prodDesc').value = p.description;
      $('prodVisible').checked = p.visible;
      $('prodInStock').checked = p.inStock;
      $('prodFeatured').checked = p.featured;
      if (p.image) { preview.innerHTML = '<img src="' + esc(p.image) + '" alt="">'; currentImageData = p.image; removeBtn.style.display = ''; }
      else { preview.textContent = 'No image'; removeBtn.style.display = 'none'; }
    } else {
      $('modalTitle').textContent = 'Add Product';
      $('productForm').reset();
      $('productId').value = '';
      $('prodVisible').checked = true;
      $('prodInStock').checked = true;
      $('prodCategory').value = $('filterCategory').value || currentData.categories[0].id;
      preview.textContent = 'No image'; removeBtn.style.display = 'none';
    }
    $('productModal').classList.add('show');
    $('prodName').focus();
  }
  function closeModal() { $('productModal').classList.remove('show'); }

  $('addProductBtn').addEventListener('click', function () { openModal(); });
  $('cancelModal').addEventListener('click', closeModal);
  $('productModal').addEventListener('click', function (e) { if (e.target === $('productModal')) closeModal(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });

  $('prodImage').addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (!file) return;
    if (file.size > 1.5 * 1024 * 1024) { alert('Please use an image under 1.5 MB.'); e.target.value = ''; return; }
    var reader = new FileReader();
    reader.onload = function (ev) {
      currentImageData = ev.target.result;
      $('imagePreview').innerHTML = '<img src="' + esc(currentImageData) + '" alt="">';
      $('removeImageBtn').style.display = '';
    };
    reader.readAsDataURL(file);
  });
  $('removeImageBtn').addEventListener('click', function () {
    currentImageData = null;
    $('imagePreview').textContent = 'No image';
    $('prodImage').value = '';
    $('removeImageBtn').style.display = 'none';
  });

  $('productForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('prodName').value.trim();
    var price = parseFloat($('prodPrice').value);
    if (!name) { alert('Please enter a product name.'); return; }
    if (!isFinite(price) || price < 0) { alert('Please enter a valid price (0 or more).'); return; }
    var fields = {
      name: name,
      category: $('prodCategory').value,
      price: Math.round(price * 100) / 100,
      description: $('prodDesc').value.trim(),
      visible: $('prodVisible').checked,
      inStock: $('prodInStock').checked,
      featured: $('prodFeatured').checked,
      image: currentImageData
    };
    var ok = change(function () {
      if (editingId) {
        var p = currentData.products.filter(function (x) { return x.id === editingId; })[0];
        Object.assign(p, fields);
      } else {
        fields.id = currentData.products.reduce(function (m, p) { return Math.max(m, p.id); }, 0) + 1;
        currentData.products.push(fields);
      }
    }, 'Product saved');
    if (ok) { closeModal(); renderProducts(); renderPreview(); renderCategories(); }
  });

  // ---------- Settings: password + quick actions ----------
  $('changePassBtn').addEventListener('click', function () {
    var cur = $('curPass').value, n1 = $('newPass').value, n2 = $('newPass2').value;
    if (cur !== getPassword()) { alert('Current password is incorrect.'); return; }
    if (n1.length < 6) { alert('The new password needs at least 6 characters.'); return; }
    if (n1 !== n2) { alert('The new passwords do not match.'); return; }
    try { setPassword(n1); } catch (e) { alert('Could not save the password in this browser.'); return; }
    $('curPass').value = ''; $('newPass').value = ''; $('newPass2').value = '';
    refreshStatus();
    toast('Password updated');
  });

  function bulk(fn, msg) {
    if (change(function () { currentData.products.forEach(fn); }, msg)) { renderProducts(); renderPreview(); }
  }
  $('markAllVisible').addEventListener('click', function () { bulk(function (p) { p.visible = true; }, 'All products visible'); });
  $('markAllStock').addEventListener('click', function () { bulk(function (p) { p.inStock = true; }, 'All marked in stock'); });
  $('clearFeatured').addEventListener('click', function () { bulk(function (p) { p.featured = false; }, 'Featured cleared'); });
  $('sortByName').addEventListener('click', function () {
    if (change(function () { currentData.products.sort(function (a, b) { return a.name.localeCompare(b.name); }); }, 'Shop order sorted A–Z')) { renderProducts(); renderPreview(); }
  });

  // ---------- Publish & backup ----------
  function download(filename, text, type) {
    var blob = new Blob([text], { type: type });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function updatePublishInfo() {
    var size = new Blob([SD.toContentJs(currentData)]).size;
    var kb = Math.round(size / 1024);
    $('contentSize').textContent = 'content.js will be about ' + kb + ' KB.' + (size > 800 * 1024 ? ' That is large because photos are embedded in it. For a faster site, keep photos as image files in the images folder instead.' : '');
  }
  function publish() {
    download('content.js', SD.toContentJs(currentData), 'text/javascript');
    toast('content.js downloaded — now replace js/content.js with it');
  }
  $('publishBtn').addEventListener('click', publish);
  $('downloadContentBtn').addEventListener('click', publish);

  $('exportBtn').addEventListener('click', function () {
    download('innovative-png-backup.json', JSON.stringify(SD.normalize(currentData), null, 2), 'application/json');
    toast('Backup downloaded');
  });
  $('importBtn').addEventListener('click', function () {
    var file = $('importFile').files[0];
    if (!file) { alert('Choose a backup file first.'); return; }
    var reader = new FileReader();
    reader.onload = function (ev) {
      var data;
      try {
        data = JSON.parse(ev.target.result);
        if (!data || !Array.isArray(data.products)) throw new Error('this is not a backup from this website');
      } catch (err) { alert('Import failed: ' + err.message); return; }
      if (!confirm('Replace all current edits with this backup?')) return;
      var before = JSON.stringify(currentData);
      currentData = SD.normalize(data);
      if (persist('Backup imported')) { renderAll(); $('importFile').value = ''; }
      else currentData = JSON.parse(before);
    };
    reader.readAsText(file);
  });

  function discardDraft() {
    if (!confirm('Discard all unpublished edits in this browser and go back to the published content?')) return;
    SD.clearDraft();
    currentData = SD.get();
    renderAll();
    toast('Back to the published content');
  }
  $('resetBtn').addEventListener('click', discardDraft);
  $('statusDiscard').addEventListener('click', discardDraft);

  if (isLoggedIn()) showAdmin();
})();
