// public/admin/js/login.js
import AuthService from './modules/services/AuthService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loginScreen = document.getElementById('login-screen');
  const appScreen = document.getElementById('app');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('login-error');
  const loginSpinner = document.getElementById('login-spinner');
  const loginText = document.getElementById('login-text');
  const loadingOverlay = document.getElementById('loading-overlay');

  const showError = (msg) => {
    if (!msg) msg = 'Unknown error';
    if (loginError) {
      loginError.textContent = msg;
      loginError.classList.remove('d-none');
    } else {
      alert(msg);
    }
  };

  // auto-login if token valid
  try {
    const ok = await AuthService.verifySession();
    if (ok) {
      loginScreen?.classList.add('d-none');
      appScreen?.classList.remove('d-none');
      await import('./admin.js');
      return;
    }
  } catch (_) {}
  loadingOverlay.style.display = 'none';

  loginForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!loginForm.checkValidity()) {
      loginForm.classList.add('was-validated');
      return;
    }

    loginError.classList.add('d-none');
    loginSpinner.classList.remove('d-none');
    loginText.textContent = 'Signing in…';

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();

    try {
      const result = await AuthService.login(email, password);
      if (!result.success) return showError(result.error || 'Login failed');

      loginScreen?.classList.add('d-none');
      appScreen?.classList.remove('d-none');

      await import('./admin.js');
    } catch (err) {
      console.error('Login error', err);
      showError(err.message || 'Login failed');
    } finally {
      loginSpinner.classList.add('d-none');
      loginText.textContent = 'Sign In';
    }
  });
});
