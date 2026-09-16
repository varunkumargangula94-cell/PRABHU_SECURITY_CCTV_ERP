// Public Website Main Logic
document.addEventListener('DOMContentLoaded', () => {
  loadFeaturedProducts();
  loadServices();
  loadHomeGallery();
  loadPublicReviews();
  setupReviewForm();
});

// Load Products
async function loadFeaturedProducts() {
  const container = document.getElementById('featured-products-container') || document.getElementById('products-catalog-container');
  if (!container) return;

  try {
    const res = await fetch('/api/products');
    const data = await res.json();
    if (data.success && data.products.length > 0) {
      window.allProducts = data.products;
      renderProducts(data.products, container);
      setupProductFilters();
    } else {
      container.innerHTML = '<div class="col-12 text-center text-muted">No products available at the moment.</div>';
    }
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

function renderProducts(products, container) {
  container.innerHTML = products.map(p => `
    <div class="col-md-6 col-lg-4">
      <div class="product-card">
        <div class="product-img-wrapper">
          <img src="${p.image_url}" alt="${p.name}">
          <span class="product-badge">${p.type}</span>
        </div>
        <div class="product-body">
          <h5 class="product-title">${p.name}</h5>
          <ul class="product-specs">
            <li><i class="bi bi-camera me-1"></i> <strong>Resolution:</strong> ${p.resolution}</li>
            <li><i class="bi bi-moon-stars me-1"></i> <strong>Night Vision:</strong> ${p.night_vision}</li>
            <li><i class="bi bi-hdd me-1"></i> <strong>Storage:</strong> ${p.storage_option}</li>
          </ul>
          <p class="text-muted small">${p.description || ''}</p>
          <div class="product-price">₹${p.price.toLocaleString('en-IN')}</div>
          <a href="/book.html?requirement=${encodeURIComponent(p.name)}" class="btn btn-green w-100 fw-bold">
            <i class="bi bi-calendar-check me-1"></i> Book Installation
          </a>
        </div>
      </div>
    </div>
  `).join('');
}

function setupProductFilters() {
  const buttons = document.querySelectorAll('#product-filters button');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('btn-green', 'active');
        b.classList.add('btn-outline-dark');
      });
      btn.classList.remove('btn-outline-dark');
      btn.classList.add('btn-green', 'active');

      const filter = btn.getAttribute('data-filter');
      const container = document.getElementById('products-catalog-container');
      if (!window.allProducts || !container) return;

      if (filter === 'ALL') {
        renderProducts(window.allProducts, container);
      } else {
        const filtered = window.allProducts.filter(p => p.type === filter);
        renderProducts(filtered, container);
      }
    });
  });
}

// Load Services
async function loadServices() {
  const container = document.getElementById('services-container') || document.getElementById('full-services-container');
  if (!container) return;

  try {
    const res = await fetch('/api/services');
    const data = await res.json();
    if (data.success && data.services.length > 0) {
      container.innerHTML = data.services.map(s => `
        <div class="col-md-6 col-lg-4">
          <div class="cctv-card">
            <div class="cctv-card-icon"><i class="bi ${s.icon || 'bi-shield-check'}"></i></div>
            <h4>${s.title}</h4>
            <p class="text-muted">${s.description}</p>
            <a href="/book.html?service=${encodeURIComponent(s.title)}" class="mt-auto fw-bold text-success-dark text-decoration-none">
              Book Service <i class="bi bi-arrow-right"></i>
            </a>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading services:', err);
  }
}

// Load Home Gallery Preview
async function loadHomeGallery() {
  const container = document.getElementById('home-gallery-container');
  if (!container) return;

  try {
    const res = await fetch('/api/work-photos');
    const data = await res.json();
    if (data.success && data.work_photos.length > 0) {
      const top3 = data.work_photos.slice(0, 3);
      container.innerHTML = top3.map(img => `
        <div class="col-md-4">
          <div class="gallery-card" onclick="window.location.href='/gallery.html'">
            <img src="${img.image_url}" alt="${img.title}">
            <div class="gallery-overlay">
              <span class="gallery-title">${img.title}</span>
              <span class="gallery-meta"><i class="bi bi-geo-alt-fill me-1"></i>${img.location || 'Client Site'}</span>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading gallery preview:', err);
  }
}

// Load Reviews
async function loadPublicReviews() {
  const container = document.getElementById('home-reviews-container') || document.getElementById('all-reviews-container');
  if (!container) return;

  try {
    const res = await fetch('/api/reviews');
    const data = await res.json();
    if (data.success && data.reviews.length > 0) {
      container.innerHTML = data.reviews.map(r => `
        <div class="col-md-6 col-lg-4">
          <div class="review-card">
            <div class="star-rating">
              ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
            </div>
            <p class="review-text">"${r.review_text}"</p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="review-author"><i class="bi bi-person-circle me-1"></i> ${r.customer_name}</span>
              <span class="review-date">${r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div class="col-12 text-center text-muted">No reviews approved yet. Be the first to review!</div>';
    }
  } catch (err) {
    console.error('Error loading reviews:', err);
  }
}

// Setup Review Submission Form
function setupReviewForm() {
  const form = document.getElementById('public-review-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = document.getElementById('review-alert-box');
    const name = document.getElementById('rev_name').value;
    const rating = document.getElementById('rev_rating').value;
    const text = document.getElementById('rev_text').value;

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: name,
          rating: rating,
          review_text: text
        })
      });

      const data = await res.json();
      if (data.success) {
        alertBox.className = 'alert alert-success';
        alertBox.innerHTML = `✅ ${data.message}`;
        form.reset();
        setTimeout(() => {
          const modalEl = document.getElementById('reviewModal');
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
          alertBox.className = 'd-none';
        }, 3500);
      } else {
        alertBox.className = 'alert alert-danger';
        alertBox.innerHTML = `❌ ${data.message}`;
      }
    } catch (err) {
      alertBox.className = 'alert alert-danger';
      alertBox.innerHTML = '❌ Failed to submit review. Server unreachable.';
    }
  });
}
