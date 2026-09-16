// Customer Installation Booking Engine
document.addEventListener('DOMContentLoaded', () => {
  const dateInput = document.getElementById('installation_date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
    
    fetchTimeSlots(today);

    dateInput.addEventListener('change', (e) => {
      fetchTimeSlots(e.target.value);
    });
  }

  // Check URL params for pre-selected product / service
  const urlParams = new URLSearchParams(window.location.search);
  const reqParam = urlParams.get('requirement') || urlParams.get('service');
  if (reqParam) {
    const messageBox = document.getElementById('customer_message');
    if (messageBox) {
      messageBox.value = `Interested in: ${reqParam}`;
    }
  }

  setupBookingSubmission();
});

// Fetch & Render Available Time Slots for selected date
async function fetchTimeSlots(dateStr) {
  const container = document.getElementById('slots-container');
  if (!container) return;

  container.innerHTML = '<div class="text-muted small"><div class="spinner-border spinner-border-sm text-success me-2"></div>Checking available time slots for ' + dateStr + '...</div>';

  try {
    const res = await fetch(`/api/time-slots?date=${encodeURIComponent(dateStr)}`);
    const data = await res.json();

    if (data.success && data.time_slots.length > 0) {
      container.innerHTML = data.time_slots.map((slot, index) => {
        const isAvailable = slot.is_available && slot.is_active === 1;
        const disabledClass = isAvailable ? '' : 'disabled';
        const labelText = isAvailable ? slot.slot_name : `${slot.slot_name} (Booked)`;
        
        return `
          <div class="slot-btn ${disabledClass}" data-slot="${slot.slot_name}" onclick="selectTimeSlot(this, ${isAvailable})">
            <i class="bi ${isAvailable ? 'bi-clock-history' : 'bi-dash-circle'} me-1"></i>
            ${labelText}
          </div>
        `;
      }).join('');

      // Auto-select first available slot if any
      const firstAvailable = container.querySelector('.slot-btn:not(.disabled)');
      if (firstAvailable) {
        selectTimeSlot(firstAvailable, true);
      } else {
        document.getElementById('selected_time_slot').value = '';
      }
    } else {
      container.innerHTML = '<div class="text-danger small">No time slots configured. Please contact support.</div>';
    }
  } catch (err) {
    console.error('Error fetching time slots:', err);
    container.innerHTML = '<div class="text-danger small">Failed to load time slots. Please refresh page.</div>';
  }
}

function selectTimeSlot(element, isAvailable) {
  if (!isAvailable) return;

  document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('selected'));
  element.classList.add('selected');

  const slotValue = element.getAttribute('data-slot');
  document.getElementById('selected_time_slot').value = slotValue;
}

function setupBookingSubmission() {
  const form = document.getElementById('customer-booking-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const errorBox = document.getElementById('booking-alert-error');
    errorBox.classList.add('d-none');

    const slotVal = document.getElementById('selected_time_slot').value;
    if (!slotVal) {
      errorBox.textContent = 'Please select an available time slot for your installation.';
      errorBox.classList.remove('d-none');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-booking');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Submitting Booking Request...';

    const payload = {
      customer_name: document.getElementById('customer_name').value,
      mobile: document.getElementById('mobile').value,
      house_number: document.getElementById('house_number').value,
      street: document.getElementById('street').value,
      area: document.getElementById('street').value, // auto-fill area
      city: document.getElementById('city').value,
      state: document.getElementById('state').value,
      pincode: document.getElementById('pincode').value,
      cctv_requirement: document.getElementById('cctv_requirement').value,
      camera_count: document.getElementById('camera_count').value,
      customer_message: document.getElementById('customer_message').value,
      installation_date: document.getElementById('installation_date').value,
      time_slot: slotVal
    };

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        document.getElementById('booking-form-box').classList.add('d-none');
        document.getElementById('success-booking-id').textContent = data.booking_id;
        document.getElementById('booking-success-box').classList.remove('d-none');
        window.scrollTo({ top: 100, behavior: 'smooth' });
      } else {
        errorBox.textContent = data.message || 'Failed to submit booking.';
        errorBox.classList.remove('d-none');
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i> Submit Installation Request';
      }
    } catch (err) {
      console.error('Booking submission error:', err);
      errorBox.textContent = 'Network or server error. Please try again.';
      errorBox.classList.remove('d-none');
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="bi bi-check-lg me-2"></i> Submit Installation Request';
    }
  });
}
