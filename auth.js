// auth.js - Client-side authentication guard

const loggedInUser = JSON.parse(sessionStorage.getItem('loggedInUser'));

if (!loggedInUser || loggedInUser.status !== 'approved') {
  // If user is not logged in or not approved, redirect to login page.
  window.location.href = 'login.html?return=unauthorized';
}
