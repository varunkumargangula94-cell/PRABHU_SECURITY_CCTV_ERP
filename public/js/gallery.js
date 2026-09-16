// Public Work Gallery Script
document.addEventListener('DOMContentLoaded', () => {
  loadGallery();
  setupGalleryFilters();
});

async function loadGallery(category = 'ALL') {
  const container = document.getElementById('public-gallery-grid');
  if (!container) return;

  container.innerHTML = '<div class="col-12 text-center text-muted"><div class="spinner-border text-success"></div> Loading installation photos...</div>';

  try {
    const url = category === 'ALL' ? '/api/work-photos' : `/api/work-photos?category=${encodeURIComponent(category)}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.success && data.work_photos.length > 0) {
      window.publicPhotos = data.work_photos;
      container.innerHTML = data.work_photos.map((img, idx) => `
        <div class="col-md-6 col-lg-4">
          <div class="gallery-card" onclick="openPhotoModal(${idx})">
            <img src="${img.image_url}" alt="${img.title}">
            <div class="gallery-overlay">
              <span class="gallery-title">${img.title}</span>
              <span class="gallery-meta"><i class="bi bi-geo-alt-fill me-1"></i>${img.location || 'Site Installation'}</span>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      container.innerHTML = '<div class="col-12 text-center text-muted py-5">No photos found in this category.</div>';
    }
  } catch (err) {
    console.error('Error loading gallery:', err);
    container.innerHTML = '<div class="col-12 text-center text-danger py-5">Failed to load work gallery.</div>';
  }
}

function setupGalleryFilters() {
  const buttons = document.querySelectorAll('#gallery-category-filters button');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('btn-green', 'active');
        b.classList.add('btn-outline-dark');
      });
      btn.classList.remove('btn-outline-dark');
      btn.classList.add('btn-green', 'active');

      const category = btn.getAttribute('data-category');
      loadGallery(category);
    });
  });
}

function openPhotoModal(index) {
  if (!window.publicPhotos || !window.publicPhotos[index]) return;
  const photo = window.publicPhotos[index];

  document.getElementById('modalImageTitle').textContent = photo.title;
  document.getElementById('modalImageSrc').src = photo.image_url;
  document.getElementById('modalImageDesc').textContent = photo.description || '';
  document.getElementById('modalImageCategory').textContent = photo.category;
  document.getElementById('modalImageLocation').innerHTML = `<i class="bi bi-geo-alt-fill me-1 text-danger"></i> ${photo.location || 'Client Site'}`;
  document.getElementById('modalImageDate').innerHTML = `<i class="bi bi-calendar-check me-1 text-primary"></i> ${photo.installation_date || ''}`;

  const modal = new bootstrap.Modal(document.getElementById('imageModal'));
  modal.show();
}
