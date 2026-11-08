document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const data = window.SiteData ? window.SiteData.get() : { products: [] };
  const products = data.products || [];

  if (data.hero) {
    const h1 = document.querySelector('.hero-promo h1');
    const lead = document.querySelector('.hero-promo .lead');
    if (h1 && data.hero.headline) h1.textContent = data.hero.headline;
    if (lead && data.hero.lead) lead.textContent = data.hero.lead;
  }

  const images = data.images || {};
  if (images.hero) {
    const box = document.querySelector('.hero-visual .placeholder-box, .hero-visual .site-image, [data-slot="hero"]');
    if (box) {
      box.className = 'site-image hero-photo';
      box.innerHTML = '<img src="' + images.hero + '" alt="Innovative PNG Ltd">';
    }
  }
  if (images.about) {
    document.querySelectorAll('[data-slot="about"]').forEach(el => {
      el.className = 'site-image';
      el.innerHTML = '<img src="' + images.about + '" alt="Our shop">';
    });
  }
  if (images.map) {
    document.querySelectorAll('[data-slot="map"]').forEach(el => {
      el.className = 'site-image map';
      el.innerHTML = '<img src="' + images.map + '" alt="Location">';
    });
  }

  function formatPrice(price) {
    return 'K' + Number(price).toFixed(2);
  }

  function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.category = product.category;
    const badge = product.inStock ? '' : '<span class="product-badge soldout">Currently unavailable</span>';
    const imgContent = product.image
      ? '<img src="' + product.image + '" alt="' + product.name + '" style="width:100%;height:100%;object-fit:cover;">' 
      : '<span style="opacity:0.55">Product photo<br><small>coming soon</small></span>';
    card.innerHTML =
      '<div class="product-image">' + badge + imgContent + '</div>' +
      '<div class="product-body">' +
        '<div class="product-cat">' + product.category + '</div>' +
        '<h3 class="product-title">' + product.name + '</h3>' +
        '<p class="product-desc">' + (product.description || '') + '</p>' +
        '<div class="product-footer">' +
          '<div class="product-price">' + formatPrice(product.price) + '<small>indicative</small></div>' +
        '</div>' +
      '</div>';
    return card;
  }

  const featuredGrid = document.getElementById('featuredProducts');
  if (featuredGrid) {
    const featured = products.filter(p => p.featured).slice(0, 8);
    const list = featured.length ? featured : products.slice(0, 4);
    if (!list.length) {
      featuredGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#5a6270">Products will appear here once added in Admin.</p>';
    } else {
      list.forEach(p => featuredGrid.appendChild(createProductCard(p)));
    }
  }

  const productGrid = document.getElementById('productGrid');
  if (productGrid) {
    products.forEach(p => productGrid.appendChild(createProductCard(p)));
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        productGrid.querySelectorAll('.product-card').forEach(card => {
          card.style.display = (filter === 'all' || card.dataset.category === filter) ? '' : 'none';
        });
      });
    });
  }

  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      alert('Thank you for your message.\n\nThis form is a demonstration. Please call +675 7994 9919 or email innovativepngltd@gmail.com.');
      contactForm.reset();
    });
  }
});
