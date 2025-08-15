// login.js - Refactored to use the backend API

document.addEventListener('DOMContentLoaded', () => {
    init();
});

let currentMode = 'user'; // 'user' or 'admin'

function init() {
    // Setup event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('user-tab').addEventListener('click', () => switchTab('user'));
    document.getElementById('admin-tab').addEventListener('click', () => switchTab('admin'));

    // No longer initializing users from localStorage
}

function switchTab(mode) {
    currentMode = mode;
    const userTab = document.getElementById('user-tab');
    const adminTab = document.getElementById('admin-tab');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const formFooter = document.querySelector('.form-footer');
    const loginButton = document.querySelector('.login-btn');


    if (mode === 'admin') {
        userTab.classList.remove('active');
        adminTab.classList.add('active');
        formTitle.textContent = 'Admin Login';
        formSubtitle.textContent = 'Enter administrator credentials';
        loginButton.textContent = 'Login';
        formFooter.style.display = 'none';
    } else {
        adminTab.classList.remove('active');
        userTab.classList.add('active');
        formTitle.textContent = 'User Login';
        formSubtitle.textContent = 'Enter your credentials to continue';
        loginButton.textContent = 'Login / Register';
        formFooter.style.display = 'block';
    }
    displayStatus(); // Clear any previous status messages
}

function displayStatus(type, message, subMessage = '') {
    const statusContainer = document.getElementById('status-container');
    statusContainer.innerHTML = '';

    if (!type || !message) return;

    const statusBox = document.createElement('div');
    statusBox.classList.add('auth-status', `status-${type}`);

    const messageP = document.createElement('p');
    messageP.innerHTML = message;
    statusBox.appendChild(messageP);

    if (subMessage) {
        const subMessageP = document.createElement('p');
        subMessageP.style.marginTop = '5px';
        subMessageP.style.fontSize = '0.9em';
        subMessageP.innerHTML = subMessage;
        statusBox.appendChild(subMessageP);
    }
    statusContainer.appendChild(statusBox);
}

async function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        displayStatus('revoked', 'Username and password cannot be empty.');
        return;
    }

    const credentials = { username, password };

    try {
        // --- 1. Attempt to log in ---
        const loginResponse = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const result = await loginResponse.json();

        if (loginResponse.ok) {
            // --- Login Successful ---
            const user = result.user;
            sessionStorage.setItem('loggedInUser', JSON.stringify(user));

            if (user.isAdmin) {
                // Admin Login
                 if (currentMode !== 'admin') {
                    displayStatus('revoked', 'Admin login is only allowed on the admin tab.');
                    return;
                }
                displayStatus('success', 'Admin access granted. Redirecting...');
                setTimeout(() => { window.location.href = 'admin.html'; }, 1500);
            } else {
                // User Login
                if (currentMode !== 'user') {
                    displayStatus('revoked', 'User login is only allowed on the user tab.');
                    return;
                }
                 switch (user.status) {
                    case 'approved':
                        displayStatus('success', 'Login successful. Redirecting...');
                        setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                        break;
                    case 'pending':
                        displayStatus('pending', '⚠️ Your account is pending admin approval.', 'Please wait for an admin to activate your account.');
                        break;
                    case 'revoked':
                        displayStatus('revoked', '⚠️ Your account access has been revoked.', `Reason: ${user.reason || 'Not specified'}`);
                        break;
                }
            }
        } else if (loginResponse.status === 401 && currentMode === 'user') {
            // --- 2. Login failed, try to register if on user tab ---
            registerUser(credentials);
        } else {
            // --- Other Login Errors ---
            displayStatus('revoked', result.message || 'An unknown error occurred.');
        }

    } catch (error) {
        console.error('Login/Register Error:', error);
        displayStatus('revoked', 'Failed to connect to the server.');
    }
}

async function registerUser(credentials) {
    try {
        const registerResponse = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const result = await registerResponse.json();

        if (registerResponse.ok) {
            displayStatus('success', '✅ Account created!', 'Awaiting admin approval...');
        } else {
            // Handle registration-specific errors, e.g., username already exists
            displayStatus('revoked', result.message || 'Registration failed.');
        }
    } catch (error) {
        console.error('Registration Error:', error);
        displayStatus('revoked', 'Failed to connect to the server for registration.');
    }
}
