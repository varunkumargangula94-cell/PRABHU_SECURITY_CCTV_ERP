// CCTV Admin Portal Management Engine
let socket;
let currentBookingData = [];

document.addEventListener('DOMContentLoaded', () => {
  checkAdminAuth();
  initSocketIO();
  setupTabNavigation();
  loadAdminDashboardData();
  setupFormListeners();
});

// Authorization Security Verification
function checkAdminAuth() {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    window.location.href = '/admin-login.html';
    return;
  }
  const user = JSON.parse(localStorage.getItem('adminUser') || '{}');
  const display = document.getElementById('admin-user-display');
  if (display && user.full_name) {
    display.innerHTML = `<i class="bi bi-person-circle me-1 text-warning"></i> ${user.full_name}`;
  }
}

function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json'
  };
}

// Initialize Socket.io Real-Time Event Connection
function initSocketIO() {
  try {
    socket = io();
    socket.emit('join_admin');

    socket.on('new_booking', (data) => {
      console.log('🔔 Socket.io New Booking Alert:', data);
      showRealtimeToast(data.message, data.booking);
      loadAdminDashboardData();
      if (document.getElementById('tab-bookings').classList.contains('active')) {
        loadBookingsTable();
      }
    });

    socket.on('new_review_submitted', () => {
      loadAdminDashboardData();
      if (document.getElementById('tab-reviews').classList.contains('active')) {
        loadAdminReviews('ALL');
      }
    });
  } catch (err) {
    console.error('Socket.io connection error:', err);
  }
}

function showRealtimeToast(message, booking) {
  const toastEl = document.getElementById('realtime-alert-toast');
  const msgEl = document.getElementById('toast-message');
  if (!toastEl || !msgEl) return;

  msgEl.innerHTML = `🔔 <strong>NEW WORK RECEIVED!</strong><br>${booking.customer_name} (${booking.mobile}) - ${booking.time_slot}`;
  toastEl.classList.remove('d-none');

  const badgeHeader = document.getElementById('header-unread-badge');
  if (badgeHeader) badgeHeader.classList.remove('d-none');
}

function hideToast() {
  const toastEl = document.getElementById('realtime-alert-toast');
  if (toastEl) toastEl.classList.add('d-none');
}

// Tab Navigation Controller
function setupTabNavigation() {
  const links = document.querySelectorAll('.admin-sidebar .nav-item a');
  links.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  document.getElementById('btn-logout').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    window.location.href = '/admin-login.html';
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.admin-sidebar .nav-item a').forEach(l => l.classList.remove('active'));
  document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('d-none'));

  const activeLink = document.querySelector(`.admin-sidebar [data-tab="${tabId}"]`);
  if (activeLink) activeLink.classList.add('active');

  const activePane = document.getElementById(tabId);
  if (activePane) activePane.classList.remove('d-none');

  // Trigger lazy loaders based on tab
  if (tabId === 'tab-dashboard') loadAdminDashboardData();
  if (tabId === 'tab-new-work') loadNewWorkDedicated();
  if (tabId === 'tab-bookings') loadBookingsTable();
  if (tabId === 'tab-timeslots') loadAdminTimeSlots();
  if (tabId === 'tab-reviews') loadAdminReviews('ALL');
  if (tabId === 'tab-gallery') loadAdminGallery();
  if (tabId === 'tab-products') loadAdminProducts();
  if (tabId === 'tab-services') loadAdminServices();
}

// Load Dashboard Overview & Stats
async function loadAdminDashboardData() {
  try {
    const res = await fetch('/api/admin/dashboard', { headers: getAuthHeaders() });
    if (res.status === 401 || res.status === 403) {
      window.location.href = '/admin-login.html';
      return;
    }
    const data = await res.json();
    if (data.success) {
      const s = data.stats;
      document.getElementById('stat-total-bookings').textContent = s.total_bookings;
      document.getElementById('stat-new-requests').textContent = s.new_requests;
      document.getElementById('stat-accepted').textContent = s.accepted + s.in_progress;
      document.getElementById('stat-completed').textContent = s.completed;
      document.getElementById('stat-total-reviews').textContent = s.total_reviews;
      document.getElementById('stat-pending-reviews').textContent = s.pending_reviews;
      document.getElementById('stat-approved-reviews').textContent = s.approved_reviews;
      document.getElementById('stat-work-photos').textContent = s.total_work_photos;

      // Update sidebar badge counters
      const badgeNew = document.getElementById('badge-new-count');
      if (badgeNew) {
        badgeNew.textContent = s.new_requests;
        badgeNew.classList.toggle('d-none', s.new_requests === 0);
      }
      const badgeRev = document.getElementById('badge-pending-rev');
      if (badgeRev) {
        badgeRev.textContent = s.pending_reviews;
        badgeRev.classList.toggle('d-none', s.pending_reviews === 0);
      }

      document.getElementById('badge-new-work-header').textContent = `${s.new_requests} Pending Requests`;

      renderNewWorkCards(data.recent_new_work, document.getElementById('dash-new-work-list'));
    }
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
  }
}

// Render NEW WORK Requests List
function renderNewWorkCards(bookings, container) {
  if (!container) return;
  if (!bookings || bookings.length === 0) {
    container.innerHTML = '<div class="text-center text-muted py-4"><i class="bi bi-check-circle fs-3 text-success d-block mb-1"></i> No new pending work requests. All caught up!</div>';
    return;
  }

  container.innerHTML = bookings.map(b => `
    <div class="new-work-card">
      <div class="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-2">
        <div>
          <span class="badge bg-warning text-dark me-2">NEW WORK</span>
          <span class="fw-bold fs-5 text-success-dark">${b.customer_name}</span>
        </div>
        <span class="text-muted small"><i class="bi bi-clock me-1"></i> ${new Date(b.created_at).toLocaleString()}</span>
      </div>

      <div class="row g-2 mb-3">
        <div class="col-md-3">
          <strong>Mobile:</strong> <a href="tel:${b.mobile}" class="text-decoration-none fw-bold text-success-dark"><i class="bi bi-telephone-fill me-1"></i> ${b.mobile}</a>
        </div>
        <div class="col-md-4">
          <strong>Address:</strong> ${b.house_number}, ${b.street}, ${b.city}, ${b.state} - ${b.pincode}
        </div>
        <div class="col-md-3">
          <strong>Installation Date:</strong> <span class="badge bg-light text-dark border">${b.installation_date}</span>
        </div>
        <div class="col-md-2">
          <strong>Time Slot:</strong> <span class="badge bg-success">${b.time_slot}</span>
        </div>
        <div class="col-12 mt-1">
          <strong>Requirement:</strong> <span class="fw-bold text-dark">${b.cctv_requirement}</span> ${b.camera_count ? `(${b.camera_count} Cameras)` : ''}
          ${b.customer_message ? `<div class="text-muted small fst-italic mt-1">"${b.customer_message}"</div>` : ''}
        </div>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <button class="btn btn-sm btn-outline-dark" onclick="viewBookingDetails(${b.id})"><i class="bi bi-eye"></i> View Details</button>
        <button class="btn btn-sm btn-primary" onclick="updateBookingStatus(${b.id}, 'ACCEPTED')"><i class="bi bi-check-lg"></i> Accept</button>
        <button class="btn btn-sm btn-info text-white" onclick="updateBookingStatus(${b.id}, 'ASSIGNED')"><i class="bi bi-person-check"></i> Assign</button>
        <button class="btn btn-sm btn-success" onclick="updateBookingStatus(${b.id}, 'COMPLETED')"><i class="bi bi-check-circle"></i> Mark Completed</button>
        <button class="btn btn-sm btn-outline-danger" onclick="updateBookingStatus(${b.id}, 'CANCELLED')"><i class="bi bi-x-circle"></i> Cancel</button>
      </div>
    </div>
  `).join('');
}

// Load NEW WORK Tab Dedicated
async function loadNewWorkDedicated() {
  try {
    const res = await fetch('/api/admin/bookings?status=NEW', { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      renderNewWorkCards(data.bookings, document.getElementById('new-work-dedicated-list'));
    }
  } catch (err) {
    console.error('Error loading new work tab:', err);
  }
}

// Load All Bookings Table
async function loadBookingsTable() {
  const tbody = document.getElementById('bookings-table-body');
  if (!tbody) return;

  const search = document.getElementById('filter-search').value;
  const status = document.getElementById('filter-status').value;
  const date = document.getElementById('filter-date').value;

  let url = `/api/admin/bookings?status=${status}`;
  if (date) url += `&date=${date}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url, { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      currentBookingData = data.bookings;
      if (data.bookings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted py-4">No bookings match the filter criteria.</td></tr>';
        return;
      }
      tbody.innerHTML = data.bookings.map(b => `
        <tr>
          <td><strong class="text-success-dark">${b.booking_id}</strong></td>
          <td>${b.customer_name}</td>
          <td><a href="tel:${b.mobile}" class="text-decoration-none fw-bold text-dark"><i class="bi bi-telephone me-1 text-success"></i>${b.mobile}</a></td>
          <td>${b.city}, ${b.state}</td>
          <td><span class="small">${b.installation_date}</span><br><span class="badge bg-light text-dark border">${b.time_slot}</span></td>
          <td><span class="small fw-bold">${b.cctv_requirement}</span></td>
          <td><span class="badge badge-status badge-${b.status.toLowerCase()}">${b.status}</span></td>
          <td>
            <button class="btn btn-sm btn-outline-dark me-1" onclick="viewBookingDetails(${b.id})" title="View Details"><i class="bi bi-eye"></i></button>
            <select class="form-select form-select-sm d-inline-block w-auto" onchange="updateBookingStatus(${b.id}, this.value)">
              <option value="NEW" ${b.status === 'NEW' ? 'selected' : ''}>NEW</option>
              <option value="ACCEPTED" ${b.status === 'ACCEPTED' ? 'selected' : ''}>ACCEPTED</option>
              <option value="ASSIGNED" ${b.status === 'ASSIGNED' ? 'selected' : ''}>ASSIGNED</option>
              <option value="IN_PROGRESS" ${b.status === 'IN_PROGRESS' ? 'selected' : ''}>IN_PROGRESS</option>
              <option value="COMPLETED" ${b.status === 'COMPLETED' ? 'selected' : ''}>COMPLETED</option>
              <option value="CANCELLED" ${b.status === 'CANCELLED' ? 'selected' : ''}>CANCELLED</option>
            </select>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading bookings table:', err);
  }
}

// View Detailed Booking Modal
async function viewBookingDetails(id) {
  try {
    const res = await fetch(`/api/admin/bookings/${id}`, { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      const b = data.booking;
      const body = document.getElementById('booking-detail-body');
      const footer = document.getElementById('booking-detail-footer');

      body.innerHTML = `
        <div class="row g-3">
          <div class="col-md-6">
            <h6 class="text-muted small text-uppercase fw-bold">Booking Reference</h6>
            <h4 class="fw-bold text-success-dark mb-0">${b.booking_id}</h4>
            <span class="badge badge-status badge-${b.status.toLowerCase()} mt-1">${b.status}</span>
          </div>
          <div class="col-md-6 text-md-end">
            <h6 class="text-muted small text-uppercase fw-bold">Booking Date & Time</h6>
            <div class="fw-bold">${new Date(b.created_at).toLocaleString()}</div>
          </div>
          <hr>
          <div class="col-md-6">
            <h6 class="text-success-dark fw-bold"><i class="bi bi-person-circle me-1"></i> Customer Information</h6>
            <div><strong>Name:</strong> ${b.customer_name}</div>
            <div><strong>Mobile:</strong> <a href="tel:${b.mobile}" class="fw-bold text-success-dark fs-5"><i class="bi bi-telephone-fill me-1"></i>${b.mobile}</a></div>
          </div>
          <div class="col-md-6">
            <h6 class="text-success-dark fw-bold"><i class="bi bi-geo-alt-fill me-1"></i> Complete Installation Address</h6>
            <div>${b.house_number}, ${b.street}, ${b.area}</div>
            <div>${b.city}, ${b.state} - <strong>${b.pincode}</strong></div>
          </div>
          <hr>
          <div class="col-md-6">
            <h6 class="text-success-dark fw-bold"><i class="bi bi-calendar-event me-1"></i> Installation Schedule</h6>
            <div><strong>Date:</strong> ${b.installation_date}</div>
            <div><strong>Time Slot:</strong> <span class="badge bg-success fs-6">${b.time_slot}</span></div>
          </div>
          <div class="col-md-6">
            <h6 class="text-success-dark fw-bold"><i class="bi bi-camera-video me-1"></i> CCTV Requirement</h6>
            <div><strong>Package:</strong> ${b.cctv_requirement}</div>
            <div><strong>Camera Count:</strong> ${b.camera_count || 'Standard'}</div>
          </div>
          ${b.customer_message ? `
            <div class="col-12">
              <div class="p-3 bg-light rounded border">
                <strong>Customer Message:</strong>
                <p class="mb-0 text-muted fst-italic">"${b.customer_message}"</p>
              </div>
            </div>
          ` : ''}
        </div>
      `;

      footer.innerHTML = `
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
        <button class="btn btn-primary" onclick="updateBookingStatus(${b.id}, 'ACCEPTED')">Accept</button>
        <button class="btn btn-info text-white" onclick="updateBookingStatus(${b.id}, 'ASSIGNED')">Assign</button>
        <button class="btn btn-success" onclick="updateBookingStatus(${b.id}, 'COMPLETED')">Mark Completed</button>
        <button class="btn btn-danger" onclick="updateBookingStatus(${b.id}, 'CANCELLED')">Cancel</button>
      `;

      const modal = new bootstrap.Modal(document.getElementById('bookingDetailModal'));
      modal.show();
    }
  } catch (err) {
    console.error('Error fetching booking details:', err);
  }
}

// Update Booking Status API Call
async function updateBookingStatus(id, newStatus) {
  try {
    const res = await fetch(`/api/admin/bookings/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus })
    });

    const data = await res.json();
    if (data.success) {
      loadAdminDashboardData();
      if (document.getElementById('tab-bookings').classList.contains('active')) {
        loadBookingsTable();
      }
      const modalEl = document.getElementById('bookingDetailModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    } else {
      alert(data.message || 'Failed to update status.');
    }
  } catch (err) {
    console.error('Error updating status:', err);
  }
}

// Load Time Slots Admin
async function loadAdminTimeSlots() {
  const grid = document.getElementById('admin-timeslots-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/admin/time-slots', { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      grid.innerHTML = data.time_slots.map(s => `
        <div class="col-md-6 col-lg-3">
          <div class="card border-0 shadow-sm rounded-4 p-3 ${s.is_active ? 'border-start border-5 border-success' : 'border-start border-5 border-secondary bg-light'}">
            <h5 class="fw-bold text-success-dark mb-1">${s.slot_name}</h5>
            <p class="text-muted small mb-2">Capacity: ${s.max_capacity} booking/slot</p>
            <div class="d-flex justify-content-between align-items-center">
              <span class="badge ${s.is_active ? 'bg-success' : 'bg-secondary'}">${s.is_active ? 'ENABLED' : 'DISABLED'}</span>
              <button class="btn btn-sm ${s.is_active ? 'btn-outline-danger' : 'btn-outline-success'}" onclick="toggleSlot(${s.id}, ${s.is_active ? 0 : 1})">
                ${s.is_active ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading time slots:', err);
  }
}

async function toggleSlot(id, newActiveState) {
  try {
    await fetch(`/api/admin/time-slots/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_active: newActiveState })
    });
    loadAdminTimeSlots();
  } catch (err) {
    console.error('Error toggling slot:', err);
  }
}

// Load Admin Reviews Moderation
async function loadAdminReviews(statusFilter = 'ALL', btnEl = null) {
  const grid = document.getElementById('admin-reviews-grid');
  if (!grid) return;

  if (btnEl) {
    btnEl.parentElement.querySelectorAll('button').forEach(b => b.classList.remove('active'));
    btnEl.classList.add('active');
  }

  try {
    const res = await fetch(`/api/admin/reviews?status=${statusFilter}`, { headers: getAuthHeaders() });
    const data = await res.json();

    if (data.success && data.reviews.length > 0) {
      grid.innerHTML = data.reviews.map(r => `
        <div class="col-md-6 col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 p-3 h-100 d-flex flex-column">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <div class="star-rating text-warning fs-5">
                ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
              </div>
              <span class="badge ${r.status === 'APPROVED' ? 'bg-success' : r.status === 'PENDING' ? 'bg-warning text-dark' : 'bg-secondary'}">${r.status}</span>
            </div>
            <p class="fst-italic text-dark mb-3 flex-grow-1">"${r.review_text}"</p>
            <div class="fw-bold text-success-dark mb-2">${r.customer_name}</div>
            <div class="d-flex gap-2">
              ${r.status !== 'APPROVED' ? `<button class="btn btn-sm btn-success flex-grow-1" onclick="updateReviewStatus(${r.id}, 'APPROVED')"><i class="bi bi-check-lg"></i> Approve</button>` : ''}
              ${r.status !== 'HIDDEN' ? `<button class="btn btn-sm btn-outline-secondary" onclick="updateReviewStatus(${r.id}, 'HIDDEN')"><i class="bi bi-eye-slash"></i> Hide</button>` : ''}
              <button class="btn btn-sm btn-outline-danger" onclick="deleteReview(${r.id})"><i class="bi bi-trash"></i></button>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      grid.innerHTML = '<div class="col-12 text-center text-muted py-4">No reviews found.</div>';
    }
  } catch (err) {
    console.error('Error loading reviews:', err);
  }
}

async function updateReviewStatus(id, newStatus) {
  try {
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus })
    });
    loadAdminReviews('ALL');
    loadAdminDashboardData();
  } catch (err) {
    console.error('Error updating review:', err);
  }
}

async function deleteReview(id) {
  if (!confirm('Are you sure you want to permanently delete this customer review?')) return;
  try {
    await fetch(`/api/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    loadAdminReviews('ALL');
    loadAdminDashboardData();
  } catch (err) {
    console.error('Error deleting review:', err);
  }
}

// Load Work Gallery Admin
async function loadAdminGallery() {
  const grid = document.getElementById('admin-gallery-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/admin/work-photos', { headers: getAuthHeaders() });
    const data = await res.json();

    if (data.success && data.work_photos.length > 0) {
      grid.innerHTML = data.work_photos.map(p => `
        <div class="col-md-6 col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 overflow-hidden h-100">
            <img src="${p.image_url}" class="card-img-top" style="height: 200px; object-fit: cover;" alt="${p.title}">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <h6 class="fw-bold text-success-dark mb-0">${p.title}</h6>
                <span class="badge ${p.is_visible ? 'bg-success' : 'bg-secondary'}">${p.is_visible ? 'VISIBLE' : 'HIDDEN'}</span>
              </div>
              <p class="text-muted small mb-2">${p.description || ''}</p>
              <div class="small text-muted mb-3"><i class="bi bi-tag-fill me-1"></i>${p.category} | <i class="bi bi-geo-alt-fill me-1"></i>${p.location || 'Site'}</div>
              <div class="d-flex gap-2">
                <button class="btn btn-sm ${p.is_visible ? 'btn-outline-secondary' : 'btn-outline-success'} flex-grow-1" onclick="togglePhotoVisibility(${p.id}, ${p.is_visible ? 0 : 1})">
                  ${p.is_visible ? '<i class="bi bi-eye-slash"></i> Hide' : '<i class="bi bi-eye"></i> Show'}
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteWorkPhoto(${p.id})"><i class="bi bi-trash"></i> Delete</button>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    } else {
      grid.innerHTML = '<div class="col-12 text-center text-muted py-5">No work photos uploaded yet.</div>';
    }
  } catch (err) {
    console.error('Error loading admin gallery:', err);
  }
}

async function togglePhotoVisibility(id, newVisibility) {
  try {
    await fetch(`/api/admin/work-photos/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ is_visible: newVisibility })
    });
    loadAdminGallery();
  } catch (err) {
    console.error('Error toggling photo visibility:', err);
  }
}

async function deleteWorkPhoto(id) {
  if (!confirm('Are you sure you want to permanently delete this work photo?')) return;
  try {
    await fetch(`/api/admin/work-photos/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    loadAdminGallery();
    loadAdminDashboardData();
  } catch (err) {
    console.error('Error deleting photo:', err);
  }
}

// Load Products Admin View
async function loadAdminProducts() {
  const grid = document.getElementById('admin-products-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/admin/products', { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      grid.innerHTML = data.products.map(p => `
        <div class="col-md-6 col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 p-3">
            <h6 class="fw-bold text-success-dark">${p.name}</h6>
            <div class="text-success fw-bold fs-5 mb-2">₹${p.price.toLocaleString('en-IN')}</div>
            <div class="small text-muted">${p.type} • ${p.resolution}</div>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

// Load Services Admin View
async function loadAdminServices() {
  const grid = document.getElementById('admin-services-grid');
  if (!grid) return;

  try {
    const res = await fetch('/api/admin/services', { headers: getAuthHeaders() });
    const data = await res.json();
    if (data.success) {
      grid.innerHTML = data.services.map(s => `
        <div class="col-md-6 col-lg-4">
          <div class="card border-0 shadow-sm rounded-4 p-3">
            <h6 class="fw-bold text-success-dark">${s.title}</h6>
            <p class="small text-muted mb-0">${s.description}</p>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading services:', err);
  }
}

// Setup Form Handlers for Work Photo Upload & Custom Time Slot Creation
function setupFormListeners() {
  // Add Work Photo Upload Form (Multipart Data)
  const photoForm = document.getElementById('add-work-photo-form');
  if (photoForm) {
    photoForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const alertBox = document.getElementById('photo-upload-alert');

      const formData = new FormData();
      const fileInput = document.getElementById('photo_file');
      if (fileInput.files.length === 0) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = 'Please choose an image file.';
        return;
      }

      formData.append('image', fileInput.files[0]);
      formData.append('title', document.getElementById('photo_title').value);
      formData.append('category', document.getElementById('photo_category').value);
      formData.append('installation_date', document.getElementById('photo_date').value);
      formData.append('location', document.getElementById('photo_location').value);
      formData.append('description', document.getElementById('photo_desc').value);

      try {
        const token = localStorage.getItem('adminToken');
        const res = await fetch('/api/admin/work-photos', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: formData
        });

        const data = await res.json();
        if (data.success) {
          alertBox.className = 'alert alert-success';
          alertBox.textContent = '✅ Work photo added successfully.';
          photoForm.reset();
          setTimeout(() => {
            const modalEl = document.getElementById('addWorkPhotoModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            alertBox.className = '';
            alertBox.textContent = '';
            loadAdminGallery();
            loadAdminDashboardData();
          }, 1500);
        } else {
          alertBox.className = 'alert alert-danger';
          alertBox.textContent = data.message || 'Upload failed.';
        }
      } catch (err) {
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = 'Server upload error.';
      }
    });
  }

  // Add Time Slot Form
  const slotForm = document.getElementById('add-timeslot-form');
  if (slotForm) {
    slotForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const slot_name = document.getElementById('new_slot_name').value;
      const start_time = document.getElementById('new_start_time').value;
      const end_time = document.getElementById('new_end_time').value;
      const max_capacity = document.getElementById('new_max_capacity').value;

      try {
        const res = await fetch('/api/admin/time-slots', {
          method: 'POST',
          headers: getAuthHeaders(),
          body: JSON.stringify({ slot_name, start_time, end_time, max_capacity })
        });
        const data = await res.json();
        if (data.success) {
          const modalEl = document.getElementById('addSlotModal');
          const modal = bootstrap.Modal.getInstance(modalEl);
          if (modal) modal.hide();
          slotForm.reset();
          loadAdminTimeSlots();
        } else {
          alert(data.message);
        }
      } catch (err) {
        console.error('Error creating slot:', err);
      }
    });
  }
}
