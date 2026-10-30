// ===== TOGGLE PASSWORD VISIBILITY =====
function togglePassword(inputId, icon) {
  const input = document.getElementById(inputId);
  if (!input) return;
  if (input.type === 'password') {
    input.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    input.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

// ===== PASSWORD STRENGTH CHECKER =====
const regPassword = document.getElementById('regPassword');
if (regPassword) {
  regPassword.addEventListener('input', function () {
    const val = this.value;
    const fill = document.getElementById('strengthFill');
    const text = document.getElementById('strengthText');
    if (!fill || !text) return;
    let strength = 0;

    if (val.length >= 6) strength++;
    if (val.match(/[A-Z]/)) strength++;
    if (val.match(/[0-9]/)) strength++;
    if (val.match(/[^a-zA-Z0-9]/)) strength++;

    const levels = [
      { width: '0%', color: '#eee', label: '' },
      { width: '25%', color: '#e74c3c', label: '🔴 Weak' },
      { width: '50%', color: '#f39c12', label: '🟡 Fair' },
      { width: '75%', color: '#3498db', label: '🔵 Good' },
      { width: '100%', color: '#27ae60', label: '🟢 Strong' },
    ];

    fill.style.width = levels[strength].width;
    fill.style.background = levels[strength].color;
    text.textContent = levels[strength].label;
  });
}

// ===== SHOW ALERT =====
function showAlert(type, message) {
  const el = document.getElementById(type + 'Alert');
  if (!el) return;
  el.innerHTML = message;
  el.style.display = 'flex';
  setTimeout(() => {
    el.style.display = 'none';
  }, 5000);
}

// ===== REGISTER USER =====
async function registerUser() {
  const nameInput = document.getElementById('regName');
  const emailInput = document.getElementById('regEmail');
  const passInput = document.getElementById('regPassword');
  const confirmInput = document.getElementById('regConfirm');
  const agreedInput = document.getElementById('agreeTerms');

  const name = nameInput ? nameInput.value.trim() : '';
  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';
  const confirm = confirmInput ? confirmInput.value : '';
  const agreed = agreedInput ? agreedInput.checked : true;

  if (!name || !email || !password || !confirm) {
    showAlert('error', '⚠️ Please fill in all fields.');
    return;
  }
  if (password !== confirm) {
    showAlert('error', '⚠️ Passwords do not match!');
    return;
  }
  if (password.length < 6) {
    showAlert('error', '⚠️ Password must be at least 6 characters.');
    return;
  }
  if (!agreed) {
    showAlert('error', '⚠️ Please agree to the Terms & Conditions.');
    return;
  }

  const btnText = document.getElementById('registerBtnText');
  const btnLoader = document.getElementById('registerBtnLoader');
  if (btnText) btnText.style.display = 'none';
  if (btnLoader) btnLoader.style.display = 'flex';

  try {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      showAlert('success', '✅ Account created! Redirecting to login...');
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 1500);
      return;
    } else {
      showAlert('error', '❌ ' + (data.message || 'Registration failed.'));
      return;
    }
  } catch (err) {
    // Static Hosting Demo Fallback
    console.warn('Backend unavailable, using static demo registration.');
    const demoUser = {
      id: 'demo_user_' + Date.now(),
      name: name,
      email: email,
      isAdmin: false,
      phone: '+92 300 1234567',
      address: 'Gulberg III',
      city: 'Lahore',
      postal: '54000',
      country: 'Pakistan',
    };
    localStorage.setItem('user', JSON.stringify(demoUser));
    localStorage.setItem('token', 'demo-token-' + Date.now());
    showAlert('success', '✅ Account created successfully! Redirecting...');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 1200);
  } finally {
    if (btnText) btnText.style.display = 'flex';
    if (btnLoader) btnLoader.style.display = 'none';
  }
}

// ===== LOGIN USER =====
async function loginUser() {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');

  const email = emailInput ? emailInput.value.trim() : '';
  const password = passInput ? passInput.value : '';

  if (!email || !password) {
    showAlert('error', '⚠️ Please enter your email and password.');
    return;
  }

  const btnText = document.getElementById('loginBtnText');
  const btnLoader = document.getElementById('loginBtnLoader');
  if (btnText) btnText.style.display = 'none';
  if (btnLoader) btnLoader.style.display = 'flex';

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('token', data.token);
      showAlert('success', '✅ Login successful! Redirecting...');
      setTimeout(() => {
        window.location.href = data.user.isAdmin ? 'admin.html' : 'index.html';
      }, 1200);
      return;
    } else {
      showAlert('error', '❌ ' + (data.message || 'Incorrect credentials.'));
      return;
    }
  } catch (err) {
    // Static Hosting Demo Fallback (Portfolio mode without live backend)
    console.warn('Backend server offline. Entering client-side demo mode.');
    const isAdmin = email.toLowerCase().includes('admin');
    const demoUser = {
      id: isAdmin ? 'admin_demo_01' : 'user_demo_01',
      name: isAdmin ? 'Store Administrator' : (email.split('@')[0] || 'Demo Customer'),
      email: email,
      isAdmin: isAdmin,
      phone: '+92 321 9876543',
      address: 'Suite 404, Main Boulevard',
      city: 'Karachi',
      postal: '75000',
      country: 'Pakistan',
    };

    localStorage.setItem('user', JSON.stringify(demoUser));
    localStorage.setItem('token', 'demo-token-' + Date.now());
    showAlert('success', `✅ Welcome back ${demoUser.name}! (Demo Mode) Redirecting...`);

    setTimeout(() => {
      window.location.href = isAdmin ? 'admin.html' : 'index.html';
    }, 1200);
  } finally {
    if (btnText) btnText.style.display = 'flex';
    if (btnLoader) btnLoader.style.display = 'none';
  }
}

// ===== QUICK TEST CREDENTIALS FILLER =====
function fillTestCreds(email, password) {
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (emailInput) emailInput.value = email;
  if (passInput) passInput.value = password;
  if (typeof showToast === 'function') {
    showToast(`Autofilled credentials for <strong>${email}</strong>`);
  }
}

// Show message if redirected from cart or wishlist
const loginMsg = localStorage.getItem('loginMessage');
if (loginMsg) {
  showAlert('error', '⚠️ ' + loginMsg);
  localStorage.removeItem('loginMessage');
}
