// admin.js

// --- 1. Initialization & Auth Guard ---
document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

    // Auth Guard: If user is not logged in or is not an admin, redirect to login.
    if (!loggedInUser || !loggedInUser.isAdmin) {
        window.location.href = 'login.html';
        return; // Stop script execution
    }

    // If authorized, proceed to initialize the dashboard.
    initAdminDashboard(loggedInUser);
});

async function initAdminDashboard(admin) {
    document.getElementById('admin-username').textContent = `User: ${admin.username}`;
    document.getElementById('logout-btn').addEventListener('click', logout);
    // Use event delegation for all user actions
    document.querySelector('.user-management').addEventListener('click', handleUserAction);
    await renderAllUsers(); // Perform the initial render
}


// --- 2. Data Management (API Calls) ---
async function getAllUsers() {
    try {
        const response = await fetch('http://localhost:3000/api/users');
        if (!response.ok) {
            throw new Error('Failed to fetch users from the server.');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        // Display an error in the UI
        document.querySelector('.user-management').innerHTML = `<p style="color:var(--error-red);">Could not fetch user data. Is the server running?</p>`;
        return []; // Return empty array on error
    }
}

async function updateUserStatus(username, newStatus, reason = '') {
    try {
        const response = await fetch(`http://localhost:3000/api/users/${username}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, reason })
        });
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message || 'Failed to update user status');
        }
        await renderAllUsers(); // Re-render the UI to show the change
    } catch (error) {
        console.error('Error updating user status:', error);
        alert(`Error: ${error.message}`);
    }
}


// --- 3. UI Rendering ---
async function renderAllUsers() {
    const users = await getAllUsers();

    const pendingContainer = document.getElementById('pending-users');
    const activeContainer = document.getElementById('active-users');
    const revokedContainer = document.getElementById('revoked-users');

    // Return early if containers aren't on the page (e.g., due to a fetch error)
    if (!pendingContainer || !activeContainer || !revokedContainer) return;

    pendingContainer.innerHTML = '';
    activeContainer.innerHTML = '';
    revokedContainer.innerHTML = '';

    let pendingCount = 0, activeCount = 0, revokedCount = 0;

    users.forEach(user => {
        if (user.isAdmin) return; // Don't display the admin

        const userCard = document.createElement('div');
        userCard.className = `user-card status-${user.status}`;
        const joinDate = new Date(user.joined).toLocaleDateString();
        let buttonsHTML = '';

        switch (user.status) {
            case 'pending':
                pendingCount++;
                buttonsHTML = `<button class="action-btn approve-btn" data-action="approve" data-username="${user.username}">Approve</button>
                               <button class="action-btn reject-btn" data-action="reject" data-username="${user.username}">Reject</button>`;
                break;
            case 'approved':
                activeCount++;
                buttonsHTML = `<button class="action-btn revoke-btn" data-action="revoke" data-username="${user.username}">Revoke</button>`;
                break;
            case 'revoked':
                revokedCount++;
                buttonsHTML = `<button class="action-btn restore-btn" data-action="restore" data-username="${user.username}">Restore</button>`;
                break;
        }

        const reasonHTML = user.status === 'revoked' && user.reason ? `<p class="reason">Reason: ${user.reason}</p>` : '';
        userCard.innerHTML = `<div class="user-info"><p class="username">${user.username}</p><p class="join-date">Joined: ${joinDate}</p>${reasonHTML}</div><div class="user-actions">${buttonsHTML}</div>`;

        if (user.status === 'pending') pendingContainer.appendChild(userCard);
        else if (user.status === 'approved') activeContainer.appendChild(userCard);
        else revokedContainer.appendChild(userCard);
    });

    if (pendingCount === 0) pendingContainer.innerHTML = '<p>No pending users.</p>';
    if (activeCount === 0) activeContainer.innerHTML = '<p>No active users.</p>';
    if (revokedCount === 0) revokedContainer.innerHTML = '<p>No revoked users.</p>';
}


// --- 4. Event Handling ---
async function handleUserAction(event) {
    const target = event.target;
    if (!target.classList.contains('action-btn')) return;

    const action = target.dataset.action;
    const username = target.dataset.username;
    if (!action || !username) return;

    switch (action) {
        case 'approve':
            await updateUserStatus(username, 'approved');
            break;
        case 'reject':
            const rejectReason = prompt(`Provide a reason for rejecting user "${username}":`);
            // If the admin cancels the prompt, don't reject with an empty reason
            if (rejectReason !== null) {
                await updateUserStatus(username, 'revoked', rejectReason || 'Rejected by admin');
            }
            break;
        case 'revoke':
            const revokeReason = prompt(`Provide a reason for revoking access for "${username}":`);
            if (revokeReason) { // Require a reason for revoking
                await updateUserStatus(username, 'revoked', revokeReason);
            } else if (revokeReason !== null) { // only alert if they clicked OK with no text
                alert('A reason is required to revoke user access.');
            }
            break;
        case 'restore':
            await updateUserStatus(username, 'approved');
            break;
    }
}

function logout() {
    sessionStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}
