// admin.js - Refactored to use the backend API

// --- 1. Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // The server now protects this page, so we can assume the user is an admin.
    // We still need the user info for the display, which we can get from sessionStorage.
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));
    initAdminDashboard(loggedInUser);
});

function initAdminDashboard(admin) {
    document.getElementById('admin-username').textContent = `User: ${admin.username}`;
    document.getElementById('logout-btn').addEventListener('click', logout);
    document.querySelector('.user-management').addEventListener('click', handleUserAction);

    // Initial fetch and render of users
    fetchAndRenderUsers();
}

// --- 2. API Data Management ---
async function fetchAndRenderUsers() {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const users = await response.json();
        renderAllUsers(users);
    } catch (error) {
        console.error("Failed to fetch users:", error);
        // Display an error message in the UI
        const pendingContainer = document.getElementById('pending-users');
        pendingContainer.innerHTML = '<p class="error">Failed to load user data. Please try again later.</p>';
    }
}

async function updateUserStatus(username, newStatus, reason = '') {
    try {
        const response = await fetch(`/api/users/${username}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: newStatus, reason: reason }),
        });

        const result = await response.json();

        if (response.ok && result.success) {
            // Refresh the user list to show the change
            fetchAndRenderUsers();
        } else {
            alert(`Failed to update user: ${result.message || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Failed to update user status:", error);
        alert('An error occurred while communicating with the server.');
    }
}

// --- 3. UI Rendering ---
function renderAllUsers(users) {
    const pendingContainer = document.getElementById('pending-users');
    const activeContainer = document.getElementById('active-users');
    const revokedContainer = document.getElementById('revoked-users');

    // Clear existing content
    pendingContainer.innerHTML = '';
    activeContainer.innerHTML = '';
    revokedContainer.innerHTML = '';

    users.forEach(user => {
        if (user.isAdmin) return; // Don't display the admin account in the lists

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

    // Add placeholder messages if lists are empty
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
            if (revokeReason === null) return; // User cancelled the prompt
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

async function logout() {
    try {
        await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
        console.error('Logout failed', error);
    } finally {
        sessionStorage.removeItem('loggedInUser');
        window.location.href = '/login.html';
    }
}
