document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('admin-login-form');
  if (!form) return;

  // If already logged in, redirect to dashboard
  if (localStorage.getItem('adminToken')) {
    window.location.href = '/admin-dashboard.html';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const alertBox = document.getElementById('login-alert');
    alertBox.classList.add('d-none');

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    const btn = document.getElementById('btn-login');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Authenticating...';

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminUser', JSON.stringify(data.user));
        window.location.href = '/admin-dashboard.html';
      } else {
        alertBox.textContent = data.message || 'Invalid login credentials.';
        alertBox.classList.remove('d-none');
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i> Login to Dashboard';
      }
    } catch (err) {
      console.error('Login error:', err);
      alertBox.textContent = 'Server communication failure. Please check backend connection.';
      alertBox.classList.remove('d-none');
      btn.disabled = false;
      btn.innerHTML = '<i class="bi bi-box-arrow-in-right me-2"></i> Login to Dashboard';
    }
  });
});
