// public/admin/js/login.js
import {AuthService} from './modules/services/AuthService.js';

document.addEventListener('DOMContentLoaded', async () => {
  const loginScreen = document.getElementById('login-screen');
  const appScreen = document.getElementById('app');
  const loginForm = document.getElementById('loginForm');
  const loginError = document.getElementById('login-error');
  const loginSpinner = document.getElementById('login-spinner');
  const loginText = document.getElementById('login-text');
  const loadingOverlay = document.getElementById('loading-overlay');

  // helper
  const showError = (msg) => {
    if (loginError) {
      loginError.textContent = msg;
      loginError.classList.remove('d-none');
    } else {
      alert(msg);
    }
  };

  // If token is present and valid — skip login
  try {
    const ok = await AuthService.verifySession();
    if (ok) {
      // Hide login, show app, load admin entrypoint
      if (loginScreen) loginScreen.classList.add('d-none');
      if (appScreen) appScreen.classList.remove('d-none');
      await import('./admin.js');
      return;
    }
  } catch (_) {
    // proceed to show login screen
  } finally {
    if (loadingOverlay) loadingOverlay.style.display = 'none';
  }

  // Bind form submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      // client-side validation (bootstrap)
      if (!loginForm.checkValidity()) {
        loginForm.classList.add('was-validated');
        return;
      }

      // UI feedback
      loginError.classList.add('d-none');
      loginSpinner.classList.remove('d-none');
      loginText.textContent = 'Signing in…';

      const email = (document.getElementById('email')?.value || '').trim();
      const password = (document.getElementById('password')?.value || '').trim();

      try {
        const result = await AuthService.login(email, password);

        if (!result.success) {
          showError(result.error || 'Login failed');
          return;
        }

        // Hide login UI, show app UI
        if (loginScreen) loginScreen.classList.add('d-none');
        if (appScreen) appScreen.classList.remove('d-none');

        // Dynamically load the admin app entrypoint
        await import('./admin.js');

      } catch (err) {
        console.error('Login flow error', err);
        showError(err.message || 'Login failed');
      } finally {
        loginSpinner.classList.add('d-none');
        loginText.textContent = 'Sign In';
      }
    });
  }
});
