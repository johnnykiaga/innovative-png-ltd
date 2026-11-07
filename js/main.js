document.addEventListener('DOMContentLoaded', () => {
  // Year
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Mobile menu
  const toggle = document.getElementById('menuToggle');
  const nav = document.getElementById('nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      nav.classList.toggle('open');
    });
  }

  // Render products
  const data = window.SiteData ? window.SiteData.get() : { products: [] };
  const products = data.products || [];

  function formatPrice(price) {
    return 'K' + price.toFixed(2);
  }

  function createProductCard(product) {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.dataset.category = product.category;

    const badge = product.inStock
      ? ''
      : '<span class="product-badge soldout">Sold out</span>';

    const imgContent = product.image
      ? `<img src="${product.image}" alt="${product.name}" style="width:100%;height:100%;object-fit:cover;">`
      : `<span style="opacity:0.5;">Product image<br><small>placeholder</small></span>`;

    card.innerHTML = `
      <div class="product-image">
        ${badge}
        ${imgContent}
      </div>
      <div class="product-body">
        <div class="product-category">${product.category}</div>
        <h3 class="product-title">${product.name}</h3>
        <p class="product-desc">${product.description}</p>
        <div class="product-footer">
          <span class="product-price">${formatPrice(product.price)}</span>
          ${product.inStock
            ? `<button class="btn btn-sm btn-primary" onclick="alert('Demo only – contact the shop to purchase.')">Enquire</button>`
            : `<button class="btn btn-sm btn-outline" disabled>Sold out</button>`}
        </div>
      </div>
    `;
    return card;
  }

  // Featured products on homepage
  const featuredGrid = document.getElementById('featuredProducts');
  if (featuredGrid) {
    const featured = products.filter(p => p.featured && p.inStock).slice(0, 4);
    if (featured.length === 0) {
      featuredGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#5c5668;">No featured products available. Add some in the Admin panel.</p>';
    } else {
      featured.forEach(p => featuredGrid.appendChild(createProductCard(p)));
    }
  }

  // Full product grid on shop page
  const productGrid = document.getElementById('productGrid');
  if (productGrid) {
    products.forEach(p => productGrid.appendChild(createProductCard(p)));

    // Filters
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        const cards = productGrid.querySelectorAll('.product-card');
        cards.forEach(card => {
          if (filter === 'all' || card.dataset.category === filter) {
            card.style.display = '';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  // Contact form demo
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      alert('Thank you! This is a demonstration form.\n\nIn a live site this would send your message to Innovative PNG Ltd.\n\nPlease call +675 7994 9919 or email innovativepngltd@gmail.com for real enquiries.');
      contactForm.reset();
    });
  }
});
