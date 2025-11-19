// Login.js
import { AuthService } from '../services/AuthService.js';

export function initLoginUI() {
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('login-error');
    const loginSpinner = document.getElementById('login-spinner');
    const loginText = document.getElementById('login-text');

    if (!loginForm) return;
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.classList.add('d-none');
        loginSpinner.classList.remove('d-none');
        loginText.textContent = 'Signing in...';

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await AuthService.login(email, password);
            window.location.reload();
        } catch (err) {
            loginError.classList.remove('d-none');
            loginError.textContent = err.message || 'Login failed';
        } finally {
            loginSpinner.classList.add('d-none');
            loginText.textContent = 'Sign In';
        }
    });
}
