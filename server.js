// ============================================================
// server.js - Entry point for the Resume Builder application
// Sets up Express, static file serving, and all API routes
// ============================================================

// Load environment variables from .env file (e.g. GEMINI_API_KEY)
require('dotenv').config();

const express = require('express');
const path = require('path');

// Initialize database and create tables if they don't exist
require('./db');

// --- App Setup ---
const app = express();
const intPort = process.env.PORT || 3000;

// Parse incoming JSON request bodies (used by POST/PUT routes)
app.use(express.json());

// Serve all static files (index.html, js/, css/) from the project root
app.use(express.static(path.join(__dirname)));

// --- API Routes ---
// All routes are prefixed with /api/ per project conventions

// All API routes are defined in api/routes.js
app.use('/api', require('./routes'));

// --- Start Server ---
app.listen(intPort, () => {
    console.log(`Resume Builder running at http://localhost:${intPort}`);
});
