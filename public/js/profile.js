// ===== USER PROFILE & ACCOUNT CONTROLLER =====

if (!isLoggedIn()) {
  requireLogin('Please login to manage your account and profile settings.');
}

async function loadUserProfile() {
  const token = getToken();

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: 'Bearer ' + token },
    });

    if (!res.ok) throw new Error('Failed to load profile');
    const user = await res.json();

    // Update Local Storage
    localStorage.setItem('user', JSON.stringify(user));

    // Populate Sidebar
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    document.getElementById('avatarInitial').textContent = initial;
    document.getElementById('sidebarUserName').textContent = user.name || 'Account';
    document.getElementById('sidebarUserEmail').textContent = user.email || '';

    if (user.isAdmin) {
      const adminLink = document.getElementById('sidebarAdminLink');
      if (adminLink) adminLink.style.display = 'block';
    }

    // Populate Form
    document.getElementById('profName').value = user.name || '';
    document.getElementById('profEmail').value = user.email || '';
    document.getElementById('profPhone').value = user.phone || '';
    document.getElementById('profAddress').value = user.address || '';
    document.getElementById('profCity').value = user.city || '';
    document.getElementById('profPostal').value = user.postal || '';
    document.getElementById('profCountry').value = user.country || 'Pakistan';
  } catch (err) {
    // Static hosting demo mode
    const user = getCurrentUser() || {
      name: 'Demo Customer',
      email: 'customer@example.com',
      phone: '+92 321 0000000',
      address: 'Suite 404, Main Boulevard',
      city: 'Karachi',
      postal: '75500',
      country: 'Pakistan',
      isAdmin: false,
    };
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    document.getElementById('avatarInitial').textContent = initial;
    document.getElementById('sidebarUserName').textContent = user.name || 'Account';
    document.getElementById('sidebarUserEmail').textContent = user.email || '';
    if (user.isAdmin) {
      const adminLink = document.getElementById('sidebarAdminLink');
      if (adminLink) adminLink.style.display = 'block';
    }
    document.getElementById('profName').value = user.name || '';
    document.getElementById('profEmail').value = user.email || '';
    document.getElementById('profPhone').value = user.phone || '';
    document.getElementById('profAddress').value = user.address || '';
    document.getElementById('profCity').value = user.city || '';
    document.getElementById('profPostal').value = user.postal || '';
    document.getElementById('profCountry').value = user.country || 'Pakistan';
  }
}

async function saveProfile(e) {
  e.preventDefault();
  const token = getToken();
  const btn = document.getElementById('btnSaveProfile');

  const payload = {
    name: document.getElementById('profName').value.trim(),
    phone: document.getElementById('profPhone').value.trim(),
    address: document.getElementById('profAddress').value.trim(),
    city: document.getElementById('profCity').value.trim(),
    postal: document.getElementById('profPostal').value.trim(),
    country: document.getElementById('profCountry').value.trim(),
  };

  if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));
      showToast('✅ Profile and shipping address saved!');
      loadUserProfile();
    } else {
      showToast(`❌ ${data.message || 'Failed to update profile.'}`);
    }
  } catch (err) {
    const existing = getCurrentUser() || {};
    const updated = { ...existing, ...payload };
    localStorage.setItem('user', JSON.stringify(updated));
    showToast('✅ Profile and shipping address saved (Demo Mode)!');
    loadUserProfile();
  }

  if (btn) btn.innerHTML = '<i class="fas fa-save"></i> Save Profile Details';
}

async function changePassword(e) {
  e.preventDefault();
  const token = getToken();
  const currentPassword = document.getElementById('currentPass').value;
  const newPassword = document.getElementById('newPass').value;
  const confirmNewPass = document.getElementById('confirmNewPass').value;
  const btn = document.getElementById('btnChangePass');

  if (newPassword !== confirmNewPass) {
    showToast('⚠️ New passwords do not match!');
    return;
  }

  if (newPassword.length < 6) {
    showToast('⚠️ New password must be at least 6 characters.');
    return;
  }

  if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';

  try {
    const res = await fetch('/api/auth/change-password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });

    const data = await res.json();
    if (res.ok) {
      showToast('🔒 Password changed successfully!');
      document.getElementById('currentPass').value = '';
      document.getElementById('newPass').value = '';
      document.getElementById('confirmNewPass').value = '';
    } else {
      showToast(`❌ ${data.message || 'Failed to change password.'}`);
    }
  } catch (err) {
    showToast('🔒 Password changed successfully (Demo Mode)!');
    document.getElementById('currentPass').value = '';
    document.getElementById('newPass').value = '';
    document.getElementById('confirmNewPass').value = '';
  }

  if (btn) btn.innerHTML = '<i class="fas fa-key"></i> Update Password';
}

document.addEventListener('DOMContentLoaded', () => {
  loadUserProfile();
});
