// login.js

document.addEventListener('DOMContentLoaded', () => {
    init();
});

let currentMode = 'user'; // 'user' or 'admin'

function init() {
    // Setup event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('user-tab').addEventListener('click', () => switchTab('user'));
    document.getElementById('admin-tab').addEventListener('click', () => switchTab('admin'));
    // User data is now managed by the backend, so no localStorage initialization is needed here.
}

function switchTab(mode) {
    currentMode = mode;
    const userTab = document.getElementById('user-tab');
    const adminTab = document.getElementById('admin-tab');
    const formTitle = document.getElementById('form-title');
    const formSubtitle = document.getElementById('form-subtitle');
    const formFooter = document.querySelector('.form-footer');

    if (mode === 'admin') {
        userTab.classList.remove('active');
        adminTab.classList.add('active');
        formTitle.textContent = 'Admin Login';
        formSubtitle.textContent = 'Enter administrator credentials';
        formFooter.style.display = 'none';
    } else {
        adminTab.classList.remove('active');
        userTab.classList.add('active');
        formTitle.textContent = 'User Login';
        formSubtitle.textContent = 'Enter your credentials to continue';
        formFooter.style.display = 'block';
    }
    displayStatus(); // Clear status messages on tab switch
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

    try {
        const loginResponse = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await loginResponse.json();

        if (loginResponse.ok) {
            const { user } = data;

            // Verify user is logging in via the correct tab
            if (currentMode === 'admin' && !user.isAdmin) {
                displayStatus('revoked', 'This is not an admin account.');
                return;
            }
             if (currentMode === 'user' && user.isAdmin) {
                displayStatus('revoked', 'Admin accounts must use the Admin Access tab.');
                return;
            }

            // Handle login based on user status
            switch (user.status) {
                case 'approved':
                    displayStatus('success', 'Login successful. Redirecting...');
                    sessionStorage.setItem('loggedInUser', JSON.stringify({ username: user.username, isAdmin: user.isAdmin }));
                    const redirectUrl = user.isAdmin ? 'admin.html' : 'index.html';
                    setTimeout(() => { window.location.href = redirectUrl; }, 1500);
                    break;
                case 'pending':
                    displayStatus('pending', '⚠️ Your account is pending admin approval.', 'Please wait for an admin to activate your account.');
                    break;
                case 'revoked':
                    displayStatus('revoked', '⚠️ Your account access has been revoked.', `Reason: ${user.reason || 'Not specified'}`);
                    break;
            }
        } else {
            // If login fails, it could be a new user or a wrong password.
            if (currentMode === 'user' && loginResponse.status === 401) {
                // Attempt to register the user.
                await handleRegistration(username, password);
            } else {
                displayStatus('revoked', data.message || 'Login failed.');
            }
        }
    } catch (error) {
        console.error('Login/Registration Error:', error);
        displayStatus('revoked', 'Could not connect to the server. Please try again later.');
    }
}

async function handleRegistration(username, password) {
    try {
        const registerResponse = await fetch('http://localhost:3000/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await registerResponse.json();

        if (registerResponse.ok) {
            displayStatus('success', '✅ Account created!', 'Awaiting admin approval...');
        } else if (registerResponse.status === 409) {
            // 409 Conflict means username exists, so the initial login failure must have been due to a wrong password.
            displayStatus('revoked', 'Invalid password for the given username.');
        } else {
            displayStatus('revoked', data.message || 'Registration failed.');
        }
    } catch (error) {
        console.error('Registration Error:', error);
        displayStatus('revoked', 'Could not connect to the server for registration.');
    }
}
