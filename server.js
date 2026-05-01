const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory database (For Render free tier testing)
let reports = [];

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
    
    reports.unshift(newReport); // Add to beginning of array
    res.status(201).json({ message: 'Report submitted successfully!', report: newReport });
});

// API: Get all reports for the admin dashboard
app.get('/api/reports', (req, res) => {
    res.json(reports);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});