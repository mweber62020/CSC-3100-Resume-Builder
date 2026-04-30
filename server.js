// ============================================================
// server.js - Entry point for the application
// Sets up Express, static file serving, and all API routes
// ============================================================

// Load GEMINI_API_KEY from .env file
require('dotenv').config();

const express = require('express');
const path = require('path');

// Initialize database
require('./db');

// Setup
const app = express();
const intPort = 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname))); // path.join(__dirname) means "the folder this file is in".
app.use('/api', require('./api/routes')); // All API routes are defined in api/routes.js

// Start Server
app.listen(intPort, () => {
    console.log(`Resume Builder running at http://localhost:${intPort}`);
});
