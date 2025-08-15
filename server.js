const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'db.json');

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('/app')); // Serve static files from the root directory

// --- Helper Functions for DB ---
const readUsers = () => {
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        return JSON.parse(data).users;
    } catch (error) {
        console.error("Error reading database:", error);
        return [];
    }
};

const writeUsers = (users) => {
    try {
        const data = JSON.stringify({ users }, null, 2); // Pretty print JSON
        fs.writeFileSync(DB_PATH, data, 'utf8');
    } catch (error) {
        console.error("Error writing to database:", error);
    }
};

// --- API Endpoints ---

// 1. User/Admin Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const users = readUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase() && u.password === password);

    if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    res.json({
        success: true,
        message: 'Login successful.',
        user: {
            username: user.username,
            isAdmin: user.isAdmin,
            status: user.status,
            reason: user.reason
        }
    });
});

// 2. New User Registration
app.post('/api/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username and password are required.' });
    }

    const users = readUsers();
    const existingUser = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (existingUser) {
        return res.status(409).json({ success: false, message: 'Username already exists.' });
    }

    const newUser = {
        username,
        password, // In a real app, this MUST be hashed.
        isAdmin: false,
        status: 'pending',
        reason: '',
        joined: new Date().toISOString()
    };

    users.push(newUser);
    writeUsers(users);

    res.status(201).json({
        success: true,
        message: 'Account created successfully. Awaiting admin approval.'
    });
});

// 3. Get All Users (for Admin)
app.get('/api/users', (req, res) => {
    const users = readUsers();
    // Exclude passwords from the response for security
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
});

// 4. Update User Status (for Admin)
app.put('/api/users/:username/status', (req, res) => {
    const { username } = req.params;
    const { status, reason } = req.body;

    if (!status) {
        return res.status(400).json({ success: false, message: 'Status is required.' });
    }

    const users = readUsers();
    const userIndex = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());

    if (userIndex === -1) {
        return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // As a safeguard, prevent the admin from changing their own status
    if (users[userIndex].isAdmin) {
        return res.status(403).json({ success: false, message: 'Cannot change admin status.' });
    }

    users[userIndex].status = status;
    users[userIndex].reason = reason || '';

    writeUsers(users);

    res.json({ success: true, message: `User ${username}'s status updated to ${status}.` });
});


// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
