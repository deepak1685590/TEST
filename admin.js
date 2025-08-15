// admin.js - Reverted to localStorage version

// --- 1. Initialization & Auth Guard ---
document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    if (!loggedInUser || !loggedInUser.isAdmin) {
        window.location.href = 'login.html';
        return;
    }
    initAdminDashboard(loggedInUser);
});

function initAdminDashboard(admin) {
    document.getElementById('admin-username').textContent = `User: ${admin.username}`;
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.querySelector('.user-management').addEventListener('click', handleUserAction);
    renderAllUsers();
}

// --- 2. Data Management (localStorage) ---
function getAllUsers() {
    return JSON.parse(localStorage.getItem('users')) || [];
}

function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function updateUserStatus(username, newStatus, reason = '') {
    let users = getAllUsers();
    const userIndex = users.findIndex(u => u.username === username);

    if (userIndex !== -1) {
        users[userIndex].status = newStatus;
        users[userIndex].reason = reason;
        saveUsers(users);
        renderAllUsers();
    }
}

// --- 3. UI Rendering ---
function renderAllUsers() {
    const users = getAllUsers();

    const pendingContainer = document.getElementById('pending-users');
    const activeContainer = document.getElementById('active-users');
    const revokedContainer = document.getElementById('revoked-users');

    pendingContainer.innerHTML = '';
    activeContainer.innerHTML = '';
    revokedContainer.innerHTML = '';

    users.forEach(user => {
        if (user.isAdmin) return;

        const userCard = document.createElement('div');
        userCard.className = `user-card status-${user.status}`;
        const joinDate = new Date(user.joined).toLocaleDateString();
        let buttonsHTML = '';

        switch (user.status) {
            case 'pending':
                buttonsHTML = `<button class="action-btn approve-btn" data-action="approve" data-username="${user.username}">Approve</button>
                               <button class="action-btn reject-btn" data-action="reject" data-username="${user.username}">Reject</button>`;
                break;
            case 'approved':
                buttonsHTML = `<button class="action-btn revoke-btn" data-action="revoke" data-username="${user.username}">Revoke</button>`;
                break;
            case 'revoked':
                buttonsHTML = `<button class="action-btn restore-btn" data-action="restore" data-username="${user.username}">Restore</button>`;
                break;
        }

        const reasonHTML = user.status === 'revoked' && user.reason ? `<p class="reason">Reason: ${user.reason}</p>` : '';

        userCard.innerHTML = `
            <div class="user-info">
                <p class="username">${user.username}</p>
                <p class="join-date">Joined: ${joinDate}</p>
                ${reasonHTML}
            </div>
            <div class="user-actions">${buttonsHTML}</div>`;

        if (user.status === 'pending') pendingContainer.appendChild(userCard);
        else if (user.status === 'approved') activeContainer.appendChild(userCard);
        else revokedContainer.appendChild(userCard);
    });

    if (pendingContainer.children.length === 0) pendingContainer.innerHTML = '<p>No pending users.</p>';
    if (activeContainer.children.length === 0) activeContainer.innerHTML = '<p>No active users.</p>';
    if (revokedContainer.children.length === 0) revokedContainer.innerHTML = '<p>No revoked users.</p>';
}

// --- 4. Event Handling ---
function handleUserAction(event) {
    const target = event.target;
    if (!target.classList.contains('action-btn')) return;

    const action = target.dataset.action;
    const username = target.dataset.username;

    if (!action || !username) return;

    switch (action) {
        case 'approve':
            updateUserStatus(username, 'approved');
            break;
        case 'reject':
            const rejectReason = prompt(`Provide a reason for rejecting user "${username}":`) || 'Rejected by admin';
            updateUserStatus(username, 'revoked', rejectReason);
            break;
        case 'revoke':
            const revokeReason = prompt(`Provide a reason for revoking access for "${username}":`);
            if (!revokeReason) {
                alert('A reason is required to revoke user access.');
                return;
            }
            updateUserStatus(username, 'revoked', revokeReason);
            break;
        case 'restore':
            updateUserStatus(username, 'approved', ''); // Clear reason on restore
            break;
    }
}

function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}
