document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

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
      ? '<img src="' + product.image + '" alt="' + product.name + '" style="width:100%;height:100%;object-fit:cover;">' 
      : '<span style="opacity:0.55">Product image<br><small>placeholder</small></span>';

    card.innerHTML =
      '<div class="product-image">' + badge + imgContent + '</div>' +
      '<div class="product-body">' +
        '<div class="product-cat">' + product.category + '</div>' +
        '<h3 class="product-title">' + product.name + '</h3>' +
        '<p class="product-desc">' + (product.description || '') + '</p>' +
        '<div class="product-footer">' +
          '<div class="product-price">' + formatPrice(product.price) + '<small>inc. GST estimate</small></div>' +
          (product.inStock
            ? '<button class="btn btn-sm btn-primary" onclick="alert(\'Demo only – contact the shop to purchase or enquire.\')">Enquire</button>'
            : '<button class="btn btn-sm" disabled style="opacity:0.5">Sold out</button>') +
        '</div>' +
      '</div>';
    return card;
  }

  const featuredGrid = document.getElementById('featuredProducts');
  if (featuredGrid) {
    const featured = products.filter(p => p.featured && p.inStock).slice(0, 8);
    if (!featured.length) {
      featuredGrid.innerHTML = '<p style="grid-column:1/-1;text-align:center;color:#5a6270">No featured products. Add some in Admin.</p>';
    } else {
      featured.forEach(p => featuredGrid.appendChild(createProductCard(p)));
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
      alert('Thank you! This is a demonstration form.\n\nPlease call +675 7994 9919 or email innovativepngltd@gmail.com for real enquiries.');
      contactForm.reset();
    });
  }
});
