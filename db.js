// ============================================================
// db.js - Sets up the database the rest of the application uses.
// Opens/creates the .db file and writes to it.
// Also exports the db connection for use in other files.
// ============================================================

const Database = require('better-sqlite3');

// Opens resume.db in the project root, or creates it if it doesn't exist
const db = new Database('resume.db');

// Create all tables if they don't already exist
db.exec(`
    -- Stores user profile info
    CREATE TABLE IF NOT EXISTS tblProfile (
        intProfileID    INTEGER PRIMARY KEY AUTOINCREMENT,
        strFirstName    TEXT NOT NULL,
        strLastName     TEXT NOT NULL,
        strEmail        TEXT NOT NULL,
        strPhone        TEXT,
        strLocation     TEXT,
        strSummary      TEXT
    );

    -- Stores jobs the user has held
    CREATE TABLE IF NOT EXISTS tblJobs (
        intJobID        INTEGER PRIMARY KEY AUTOINCREMENT,
        strCompany      TEXT NOT NULL,
        strTitle        TEXT NOT NULL,
        strStartDate    TEXT,
        strEndDate      TEXT,
        strLocation     TEXT
    );

    -- Stores individual responsibilities tied to a job
    CREATE TABLE IF NOT EXISTS tblResponsibilities (
        intResponsibilityID INTEGER PRIMARY KEY AUTOINCREMENT,
        intJobID            INTEGER NOT NULL,
        strDescription      TEXT NOT NULL,
        FOREIGN KEY (intJobID) REFERENCES tblJobs(intJobID) -- Ties responsibility to a specific job
    );

    -- Stores skills (can be grouped by category)
    CREATE TABLE IF NOT EXISTS tblSkills (
        intSkillID      INTEGER PRIMARY KEY AUTOINCREMENT,
        strName         TEXT NOT NULL,
        strCategory     TEXT
    );

    -- Stores education history
    CREATE TABLE IF NOT EXISTS tblEducation (
        intEducationID  INTEGER PRIMARY KEY AUTOINCREMENT,
        strSchool       TEXT NOT NULL,
        strDegree       TEXT,
        strFieldOfStudy TEXT,
        strGradYear     TEXT
    );

    -- Stores certifications
    CREATE TABLE IF NOT EXISTS tblCertifications (
        intCertID       INTEGER PRIMARY KEY AUTOINCREMENT,
        strName         TEXT NOT NULL,
        strIssuer       TEXT,
        strDate         TEXT
    );

    -- Stores awards and achievements
    CREATE TABLE IF NOT EXISTS tblAwards (
        intAwardID      INTEGER PRIMARY KEY AUTOINCREMENT,
        strName         TEXT NOT NULL,
        strIssuer       TEXT,
        strDate         TEXT,
        strDescription  TEXT
    );

    -- Stores app settings. Always one row.
    CREATE TABLE IF NOT EXISTS tblSettings (
        intSettingID    INTEGER PRIMARY KEY AUTOINCREMENT,
        strGeminiApiKey TEXT,
        strResumeFont   TEXT DEFAULT 'Arial'
    );
`);

// Inserts a settings row if the table is empty so that UPDATE can be used without worrying about whether a row exists or not.
const objSettings = db.prepare(`SELECT intSettingID FROM tblSettings LIMIT 1`).get();
if (!objSettings) {
    db.prepare(`INSERT INTO tblSettings (strGeminiApiKey, strResumeFont) VALUES (null, 'Arial')`).run();
}

// Allows other files to connect to the database.
module.exports = { db };
