const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = process.env.RENDER ? '/data' : '.';
const DATA_FILE = path.join(DATA_DIR, 'reports.json');

if (process.env.RENDER && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

const getReports = () => JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
const saveReports = (reports) => fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2));

const requireAuth = (req, res, next) => {
    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [username, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    const ADMIN_USER = 'admin';
    const ADMIN_PASS = process.env.ADMIN_KEY || 'Revival2026'; 

    if (username === ADMIN_USER && password === ADMIN_PASS) {
        return next(); 
    }

    res.set('WWW-Authenticate', 'Basic realm="DLCF Admin Dashboard"');
    res.status(401).send('Access Denied.');
};

app.use('/dashboard.html', requireAuth);
app.use('/dashboard', requireAuth);

app.use(cors());
app.use(bodyParser.json());

app.get('/api/reports', requireAuth, (req, res) => {
    res.json(getReports());
});

// UPDATED: Now accepts the new fields
app.post('/api/reports', (req, res) => {
    const { 
        section, commissionHeads, leader, team, 
        preparations, activities, challenges, performance, suggestions 
    } = req.body;
    
    const newReport = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-GB'),
        section, commissionHeads, leader, team, 
        preparations, activities, challenges, performance, suggestions
    };
    
    const reports = getReports();
    reports.unshift(newReport); 
    saveReports(reports); 
    
    res.status(201).json({ message: 'Report submitted!' });
});

app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
