const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Disk setup for permanent storage
const DATA_DIR = process.env.RENDER ? '/data' : '.';
const DATA_FILE = path.join(DATA_DIR, 'reports.json');

if (process.env.RENDER && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Helper functions for data
const getReports = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const saveReports = (reports) => fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2));

// --- NEW: SECURITY GUARD MIDDLEWARE ---
const requireAuth = (req, res, next) => {
    // Read the authorization header sent by the browser
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    // The login credentials
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = process.env.ADMIN_KEY || 'Revival2026'; // Default key if not set in Render

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        return next(); // Access granted! Let them pass.
    }

    // Access denied! Trigger the browser login popup.
    res.set('WWW-Authenticate', 'Basic realm="DLCF Admin Dashboard"');
    res.status(401).send('Access Denied. Please provide the correct Username and Access Key.');
};

// --- APPLY SECURITY ---
// Lock the dashboard HTML files
app.use('/dashboard.html', requireAuth);
app.use('/dashboard', requireAuth);

// Middleware for parsing data
app.use(cors());
app.use(bodyParser.json());

// --- API ROUTES ---
// API: Get all reports (PROTECTED: Only admin can view data)
app.get('/api/reports', requireAuth, (req, res) => {
    res.json(getReports());
});

// API: Submit a report (PUBLIC: Anyone can submit)
app.post('/api/reports', (req, res) => {
    const { section, leader, achievements, challenges, suggestions } = req.body;
    
    const newReport = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-GB'),
        section, leader, achievements, challenges, suggestions
    };
    
    const reports = getReports();
    reports.unshift(newReport); 
    saveReports(reports); 
    
    res.status(201).json({ message: 'Report submitted successfully!', report: newReport });
});

// Serve the public folder (index.html, style.css)
app.use(express.static(path.join(__dirname, 'public')));

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
