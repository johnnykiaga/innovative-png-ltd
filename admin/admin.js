const DEFAULT_PASSWORD = 'innovative2024';
let currentData = null, editingId = null, currentImageData = null;

function getPassword() { return localStorage.getItem('ipng_admin_pass') || DEFAULT_PASSWORD; }
function setPassword(p) { localStorage.setItem('ipng_admin_pass', p); }
function isLoggedIn() { return sessionStorage.getItem('ipng_admin') === '1'; }
function setLoggedIn(v) { if (v) sessionStorage.setItem('ipng_admin','1'); else sessionStorage.removeItem('ipng_admin'); }
function toast(msg) { const el = document.getElementById('toast'); el.textContent = msg; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 2500); }
function save() { window.SiteData.save(currentData); }

function showAdmin() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminWrap').classList.add('active');
  currentData = window.SiteData.get();
  if (!currentData.images) currentData.images = {};
  if (!currentData.hero) currentData.hero = { headline: '', lead: '' };
  renderStats(); renderProducts(); loadSiteForm(); loadPageEditor();
}
function showLogin() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminWrap').classList.remove('active');
}

document.getElementById('loginForm').addEventListener('submit', e => {
  e.preventDefault();
  if (document.getElementById('password').value === getPassword()) { setLoggedIn(true); showAdmin(); }
  else document.getElementById('loginError').classList.add('show');
});
document.getElementById('logoutBtn').addEventListener('click', () => { setLoggedIn(false); showLogin(); });
if (isLoggedIn()) showAdmin();

document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.tab).classList.add('active');
    if (btn.dataset.tab === 'pages') loadPageEditor();
  });
});

function renderStats() {
  const products = currentData.products || [];
  document.getElementById('statTotal').textContent = products.length;
  document.getElementById('statStock').textContent = products.filter(p => p.inStock).length;
  document.getElementById('statOut').textContent = products.filter(p => !p.inStock).length;
  document.getElementById('statFeat').textContent = products.filter(p => p.featured).length;
}

function setSlotImage(slotEl, dataUrl) {
  if (dataUrl) {
    slotEl.classList.add('has-image');
    let img = slotEl.querySelector('img');
    if (!img) { img = document.createElement('img'); slotEl.appendChild(img); }
    img.src = dataUrl;
  } else {
    slotEl.classList.remove('has-image');
    const img = slotEl.querySelector('img');
    if (img) img.remove();
  }
}

function bindSlot(slotId, fileId, key, clearId) {
  const slot = document.getElementById(slotId);
  const file = document.getElementById(fileId);
  slot.addEventListener('click', () => file.click());
  file.addEventListener('change', e => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 2 * 1024 * 1024) { alert('Please use an image under 2 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      currentData.images[key] = ev.target.result;
      save();
      setSlotImage(slot, ev.target.result);
      toast('Image saved — appears on the public site');
    };
    reader.readAsDataURL(f);
  });
  document.getElementById(clearId).addEventListener('click', e => {
    e.stopPropagation();
    currentData.images[key] = null;
    save();
    setSlotImage(slot, null);
    file.value = '';
    toast('Image removed');
  });
}

function loadPageEditor() {
  const h = currentData.hero || {};
  document.getElementById('heroHeadline').value = h.headline || 'Stationery, Mobile & Laptop Accessories';
  document.getElementById('heroLead').value = h.lead || 'Quality products for schools, offices and everyday use in Mount Hagen.';
  const imgs = currentData.images || {};
  setSlotImage(document.getElementById('slotHero'), imgs.hero);
  setSlotImage(document.getElementById('slotAbout'), imgs.about);
  setSlotImage(document.getElementById('slotMap'), imgs.map);
  const box = document.getElementById('ppFeatured');
  box.innerHTML = '';
  const featured = (currentData.products || []).filter(p => p.featured).slice(0, 4);
  const list = featured.length ? featured : (currentData.products || []).slice(0, 4);
  if (!list.length) {
    box.innerHTML = '<p class="empty" style="grid-column:1/-1">No products yet</p>';
  } else {
    list.forEach(p => {
      const d = document.createElement('div');
      d.className = 'pp-prod';
      d.innerHTML = '<div class="pp-prod-img">' + (p.image ? '<img src="'+p.image+'" alt="">' : 'No photo') + '</div><div class="pp-prod-body"><strong>'+escapeHtml(p.name)+'</strong><span>K'+Number(p.price).toFixed(2)+'</span></div>';
      box.appendChild(d);
    });
  }
}

bindSlot('slotHero', 'fileHero', 'hero', 'clearHero');
bindSlot('slotAbout', 'fileAbout', 'about', 'clearAbout');
bindSlot('slotMap', 'fileMap', 'map', 'clearMap');

document.getElementById('saveHeroBtn').addEventListener('click', () => {
  currentData.hero = {
    headline: document.getElementById('heroHeadline').value.trim(),
    lead: document.getElementById('heroLead').value.trim()
  };
  save();
  toast('Hero text saved');
});

function escapeHtml(s) { return String(s||'').replace(/[&<>"']/g, c => ({'&':'&','<':'<','>':'>','"':'"',"'":'&#39;'}[c])); }

function getFilteredProducts() {
  let list = [...(currentData.products || [])];
  const q = (document.getElementById('searchProducts').value || '').toLowerCase().trim();
  const cat = document.getElementById('filterCategory').value;
  const stock = document.getElementById('filterStock').value;
  const sort = document.getElementById('sortProducts').value;
  if (q) list = list.filter(p => (p.name||'').toLowerCase().includes(q) || (p.description||'').toLowerCase().includes(q));
  if (cat) list = list.filter(p => p.category === cat);
  if (stock === 'in') list = list.filter(p => p.inStock);
  if (stock === 'out') list = list.filter(p => !p.inStock);
  if (sort === 'name') list.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  if (sort === 'price-asc') list.sort((a,b)=>a.price-b.price);
  if (sort === 'price-desc') list.sort((a,b)=>b.price-a.price);
  if (sort === 'newest') list.sort((a,b)=>b.id-a.id);
  return list;
}

function renderProducts() {
  const list = document.getElementById('productList');
  const products = getFilteredProducts();
  list.innerHTML = '';
  if (!products.length) { list.innerHTML = '<p class="empty">No products yet. Add one to showcase.</p>'; renderStats(); return; }
  products.forEach(p => {
    const row = document.createElement('div');
    row.className = 'product-row';
    const thumb = p.image ? '<img src="'+p.image+'" alt="">' : 'No photo';
    const badges = '<span class="badge '+(p.inStock?'':'out')+'">'+(p.inStock?'Shown':'Hidden')+'</span>'+(p.featured?'<span class="badge feat">Featured</span>':'');
    row.innerHTML = '<div class="product-thumb">'+thumb+'</div><div class="product-info"><h3>'+escapeHtml(p.name)+'</h3><p>K'+Number(p.price).toFixed(2)+' · '+escapeHtml(p.category)+'</p></div><div>'+badges+'</div><div class="row-actions"><button class="btn btn-secondary btn-sm" data-edit="'+p.id+'">Edit</button><button class="btn btn-secondary btn-sm" data-dup="'+p.id+'">Copy</button><button class="btn btn-secondary btn-sm" data-toggle="'+p.id+'">'+(p.inStock?'Hide':'Show')+'</button><button class="btn btn-danger btn-sm" data-delete="'+p.id+'">Delete</button></div>';
    list.appendChild(row);
  });
  list.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => openModal(+btn.dataset.edit)));
  list.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => {
    if (confirm('Delete this product?')) { currentData.products = currentData.products.filter(p => p.id !== +btn.dataset.delete); save(); renderProducts(); toast('Deleted'); }
  }));
  list.querySelectorAll('[data-dup]').forEach(btn => btn.addEventListener('click', () => {
    const src = currentData.products.find(p => p.id === +btn.dataset.dup); if (!src) return;
    const newId = Math.max(0, ...currentData.products.map(p => p.id)) + 1;
    currentData.products.push({ ...JSON.parse(JSON.stringify(src)), id: newId, name: src.name + ' (copy)' });
    save(); renderProducts(); toast('Duplicated');
  }));
  list.querySelectorAll('[data-toggle]').forEach(btn => btn.addEventListener('click', () => {
    const p = currentData.products.find(x => x.id === +btn.dataset.toggle); if (!p) return;
    p.inStock = !p.inStock; save(); renderProducts(); toast(p.inStock ? 'Shown on site' : 'Hidden');
  }));
  renderStats();
}

['searchProducts','filterCategory','filterStock','sortProducts'].forEach(id => {
  document.getElementById(id).addEventListener('input', renderProducts);
  document.getElementById(id).addEventListener('change', renderProducts);
});

function openModal(id) {
  editingId = id || null; currentImageData = null;
  const preview = document.getElementById('imagePreview');
  const removeBtn = document.getElementById('removeImageBtn');
  document.getElementById('prodImage').value = '';
  if (id) {
    const p = currentData.products.find(x => x.id === id);
    document.getElementById('modalTitle').textContent = 'Edit Product';
    document.getElementById('productId').value = p.id;
    document.getElementById('prodName').value = p.name;
    document.getElementById('prodCategory').value = p.category;
    document.getElementById('prodPrice').value = p.price;
    document.getElementById('prodDesc').value = p.description || '';
    document.getElementById('prodInStock').checked = !!p.inStock;
    document.getElementById('prodFeatured').checked = !!p.featured;
    if (p.image) { preview.innerHTML = '<img src="'+p.image+'" alt="">'; currentImageData = p.image; removeBtn.style.display = ''; }
    else { preview.textContent = 'No image'; removeBtn.style.display = 'none'; }
  } else {
    document.getElementById('modalTitle').textContent = 'Add Product';
    document.getElementById('productForm').reset();
    document.getElementById('productId').value = '';
    document.getElementById('prodInStock').checked = true;
    preview.textContent = 'No image'; removeBtn.style.display = 'none';
  }
  document.getElementById('productModal').classList.add('show');
}

document.getElementById('addProductBtn').addEventListener('click', () => openModal());
document.getElementById('cancelModal').addEventListener('click', () => document.getElementById('productModal').classList.remove('show'));
document.getElementById('prodImage').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  if (file.size > 1.5*1024*1024) { alert('Image under 1.5 MB please'); return; }
  const reader = new FileReader();
  reader.onload = ev => { currentImageData = ev.target.result; document.getElementById('imagePreview').innerHTML = '<img src="'+currentImageData+'" alt="">'; document.getElementById('removeImageBtn').style.display = ''; };
  reader.readAsDataURL(file);
});
document.getElementById('removeImageBtn').addEventListener('click', () => {
  currentImageData = null; document.getElementById('imagePreview').textContent = 'No image';
  document.getElementById('prodImage').value = ''; document.getElementById('removeImageBtn').style.display = 'none';
});
document.getElementById('productForm').addEventListener('submit', e => {
  e.preventDefault();
  const name = document.getElementById('prodName').value.trim();
  const category = document.getElementById('prodCategory').value;
  const price = parseFloat(document.getElementById('prodPrice').value);
  const description = document.getElementById('prodDesc').value.trim();
  const inStock = document.getElementById('prodInStock').checked;
  const featured = document.getElementById('prodFeatured').checked;
  if (editingId) {
    const p = currentData.products.find(x => x.id === editingId);
    Object.assign(p, { name, category, price, description, inStock, featured, image: currentImageData });
  } else {
    const newId = currentData.products.length ? Math.max(...currentData.products.map(p => p.id)) + 1 : 1;
    currentData.products.push({ id: newId, name, category, price, description, inStock, featured, image: currentImageData });
  }
  save(); document.getElementById('productModal').classList.remove('show'); renderProducts(); toast('Product saved');
});

function loadSiteForm() {
  const s = currentData.site || {};
  document.getElementById('siteName').value = s.businessName || '';
  document.getElementById('siteTagline').value = s.tagline || 'Creative · Reliable · Future-Ready';
  document.getElementById('sitePhone').value = s.phone || '';
  document.getElementById('siteEmail').value = s.email || '';
  document.getElementById('siteAddress').value = s.address || '';
  document.getElementById('siteHours').value = s.hours || '';
}
document.getElementById('saveSiteBtn').addEventListener('click', () => {
  currentData.site = {
    businessName: document.getElementById('siteName').value.trim(),
    tagline: document.getElementById('siteTagline').value.trim(),
    phone: document.getElementById('sitePhone').value.trim(),
    email: document.getElementById('siteEmail').value.trim(),
    address: document.getElementById('siteAddress').value.trim(),
    hours: document.getElementById('siteHours').value.trim()
  };
  save(); toast('Business info saved');
});

document.getElementById('changePassBtn').addEventListener('click', () => {
  const cur = document.getElementById('curPass').value, n1 = document.getElementById('newPass').value, n2 = document.getElementById('newPass2').value;
  if (cur !== getPassword()) { alert('Current password incorrect'); return; }
  if (n1.length < 6) { alert('At least 6 characters'); return; }
  if (n1 !== n2) { alert('Passwords do not match'); return; }
  setPassword(n1); document.getElementById('curPass').value=''; document.getElementById('newPass').value=''; document.getElementById('newPass2').value=''; toast('Password updated');
});
document.getElementById('markAllStock').addEventListener('click', () => { currentData.products.forEach(p => p.inStock = true); save(); renderProducts(); toast('All shown'); });
document.getElementById('clearFeatured').addEventListener('click', () => { currentData.products.forEach(p => p.featured = false); save(); renderProducts(); toast('Featured cleared'); });
document.getElementById('sortByName').addEventListener('click', () => { currentData.products.sort((a,b)=>(a.name||'').localeCompare(b.name||'')); save(); renderProducts(); toast('Sorted'); });

document.getElementById('exportBtn').addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'innovative-png-data.json'; a.click(); URL.revokeObjectURL(url); toast('Downloaded');
});
document.getElementById('importBtn').addEventListener('click', () => {
  const file = document.getElementById('importFile').files[0]; if (!file) { alert('Choose a file'); return; }
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const data = JSON.parse(ev.target.result);
      if (!data.products) throw new Error('Invalid file');
      if (!confirm('Replace all current data?')) return;
      currentData = data; if (!currentData.images) currentData.images = {}; save();
      renderProducts(); loadSiteForm(); loadPageEditor(); toast('Imported');
    } catch (err) { alert('Import failed: ' + err.message); }
  };
  reader.readAsText(file);
});
document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Reset to demo defaults?')) return;
  localStorage.removeItem('innovativePngData');
  currentData = window.SiteData.get();
  renderProducts(); loadSiteForm(); loadPageEditor(); toast('Reset done');
});
