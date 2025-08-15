const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001; // Using port 3001 to avoid conflicts
const DB_PATH = path.join(__dirname, 'db.json');

// --- In-memory Session Store ---
// In a production app, use a proper session store like Redis.
const sessions = {};

// --- Middleware ---
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());
// Public assets that do not require authentication
app.use(express.static(path.join(__dirname, 'public')));


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
        const data = JSON.stringify({ users }, null, 2);
        fs.writeFileSync(DB_PATH, data, 'utf8');
    } catch (error) {
        console.error("Error writing to database:", error);
    }
};

// --- Authentication Middleware ---
const authMiddleware = (req, res, next) => {
    const token = req.cookies.session_token;
    if (!token) {
        return res.redirect('/login.html');
    }

    const userSession = sessions[token];
    if (!userSession) {
        // Clear the invalid cookie
        res.clearCookie('session_token');
        return res.redirect('/login.html');
    }

    // Attach user to the request object
    req.user = userSession.user;
    next();
};

const adminOnly = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).send('Forbidden: Admins only');
    }
    next();
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

    if (user.status !== 'approved') {
         return res.status(403).json({ success: false, message: `Your account is ${user.status}.`, status: user.status, reason: user.reason });
    }

    // Create a session token
    const token = crypto.randomBytes(64).toString('hex');
    sessions[token] = { user };

    res.cookie('session_token', token, {
        httpOnly: true, // Prevents client-side JS from accessing the cookie
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.json({
        success: true,
        message: 'Login successful.',
        user: { // Still send user info for the client to use
            username: user.username,
            isAdmin: user.isAdmin
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
    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(409).json({ success: false, message: 'Username already exists.' });
    }

    const newUser = {
        username,
        password,
        isAdmin: false,
        status: 'pending',
        reason: '',
        joined: new Date().toISOString()
    };
    users.push(newUser);
    writeUsers(users);

    res.status(201).json({ success: true, message: 'Account created successfully. Awaiting admin approval.' });
});

// 3. Get All Users (for Admin) - Now protected
app.get('/api/users', authMiddleware, adminOnly, (req, res) => {
    const users = readUsers();
    const safeUsers = users.map(({ password, ...user }) => user);
    res.json(safeUsers);
});

// 4. Update User Status (for Admin) - Now protected
app.put('/api/users/:username/status', authMiddleware, adminOnly, (req, res) => {
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
    if (users[userIndex].isAdmin) {
        return res.status(403).json({ success: false, message: 'Cannot change admin status.' });
    }

    users[userIndex].status = status;
    users[userIndex].reason = reason || '';
    writeUsers(users);

    res.json({ success: true, message: `User ${username}'s status updated to ${status}.` });
});

// 5. Logout
app.post('/api/logout', (req, res) => {
    const token = req.cookies.session_token;
    delete sessions[token];
    res.clearCookie('session_token');
    res.json({ success: true, message: 'Logged out successfully.' });
});


// --- Protected Page Routes ---

// Serve index.html for the root route, but only if authenticated
app.get('/', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.get('/index.html', authMiddleware, (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve admin.html, but only if authenticated and admin
app.get('/admin.html', authMiddleware, adminOnly, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/admin.js', authMiddleware, adminOnly, (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.js'));
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
