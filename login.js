// login.js - Reverted to localStorage version

document.addEventListener('DOMContentLoaded', () => {
    init();
});

let currentMode = 'user'; // 'user' or 'admin'

function init() {
    // Setup event listeners
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('user-tab').addEventListener('click', () => switchTab('user'));
    document.getElementById('admin-tab').addEventListener('click', () => switchTab('admin'));

    // Initialize users in localStorage if not present
    if (!localStorage.getItem('users')) {
        const adminUser = [{
            username: "DG143",
            password: "DG143",
            isAdmin: true,
            status: "approved",
            reason: "",
            joined: new Date().toISOString()
        }];
        localStorage.setItem('users', JSON.stringify(adminUser));
    }
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
    displayStatus();
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

function handleLogin(event) {
    event.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    if (!username || !password) {
        displayStatus('revoked', 'Username and password cannot be empty.');
        return;
    }

    if (currentMode === 'admin') {
        // Admin login is a special case
        if (username === 'DG143' && password === 'DG143') {
            displayStatus('success', 'Admin access granted. Redirecting...');
            sessionStorage.setItem('loggedInUser', JSON.stringify({ username, isAdmin: true }));
            setTimeout(() => { window.location.href = 'admin.html'; }, 1500);
        } else {
            displayStatus('revoked', 'Invalid admin credentials.');
        }
        return;
    }

    // User Login / Registration
    const users = JSON.parse(localStorage.getItem('users'));
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (user) {
        // Existing user
        if (user.password === password) {
            switch (user.status) {
                case 'approved':
                    displayStatus('success', 'Login successful. Redirecting...');
                    sessionStorage.setItem('loggedInUser', JSON.stringify({ username, isAdmin: false }));
                    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                    break;
                case 'pending':
                    displayStatus('pending', '⚠️ Your account is pending admin approval.', 'Please wait for an admin to activate your account.');
                    break;
                case 'revoked':
                    displayStatus('revoked', '⚠️ Your account access has been revoked.', `Reason: ${user.reason || 'Not specified'}`);
                    break;
            }
        } else {
            displayStatus('revoked', 'Invalid username or password.');
        }
    } else {
        // New user registration
        const newUser = {
            username,
            password,
            isAdmin: false,
            status: 'pending',
            reason: '',
            joined: new Date().toISOString()
        };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));
        displayStatus('success', '✅ Account created!', 'Awaiting admin approval...');
    }
}
