const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs'); // Added to handle reading/writing to the disk

const app = express();
const PORT = process.env.PORT || 3000;

// Set up the permanent disk path. 
// Render will mount our disk at '/data'. If running locally, it uses the current folder.
const DATA_DIR = process.env.RENDER ? '/data' : '.';
const DATA_FILE = path.join(DATA_DIR, 'reports.json');

// Ensure the directory and file exist when the server starts
if (process.env.RENDER && !fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([])); // Create empty array if no file exists
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helper function to read reports from the permanent disk
const getReports = () => {
    const data = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(data);
};

// Helper function to save reports to the permanent disk
const saveReports = (reports) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2));
};

// API: Submit a new daily report
app.post('/api/reports', (req, res) => {
    const { section, leader, achievements, challenges, suggestions } = req.body;
    
    const newReport = {
        id: Date.now(),
        date: new Date().toLocaleDateString('en-GB'),
        section,
        leader,
        achievements,
        challenges,
        suggestions
    };
    
    // Read existing, add new, save back to disk
    const reports = getReports();
    reports.unshift(newReport); 
    saveReports(reports); 
    
    res.status(201).json({ message: 'Report submitted successfully!', report: newReport });
});

// API: Get all reports for the admin dashboard
app.get('/api/reports', (req, res) => {
    const reports = getReports();
    res.json(reports);
});

// Serve the dashboard without needing .html in the URL
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
