// ============================================================
// api/routes.js - All API routes for the application
//
// Mounted in server.js. Every route is accessed by /api/<route>.
//
// Routes by section:
//
//   PROFILE
//     GET  /api/profile          - get the profile
//     POST /api/profile          - create the profile
//     PUT  /api/profile/:id      - update the profile
//
//   JOBS
//     GET    /api/jobs           - get all jobs
//     POST   /api/jobs           - create a job
//     PUT    /api/jobs/:id       - update a job
//     DELETE /api/jobs/:id       - delete a job and its responsibilities
//
//   RESPONSIBILITIES
//     GET    /api/responsibilities?intJobID=1  - get responsibilities for a job
//     POST   /api/responsibilities             - add a responsibility
//     PUT    /api/responsibilities/:id         - update a responsibility
//     DELETE /api/responsibilities/:id         - delete a responsibility
//
//   EDUCATION
//     GET    /api/education      - get all education entries
//     POST   /api/education      - create an education entry
//     DELETE /api/education/:id  - delete an education entry
//
//   SKILLS
//     GET    /api/skills         - get all skills
//     POST   /api/skills         - create a skill
//     DELETE /api/skills/:id     - delete a skill
//
//   CERTIFICATIONS
//     GET    /api/certs          - get all certifications
//     POST   /api/certs          - create a certification
//     DELETE /api/certs/:id      - delete a certification
//
//   AWARDS
//     GET    /api/awards         - get all awards
//     POST   /api/awards         - create an award
//     DELETE /api/awards/:id     - delete an award
//
//   SETTINGS
//     GET  /api/settings         - get all settings
//     POST /api/settings         - save a setting
//
//   GEMINI
//     POST /api/gemini/suggest   - suggest improvements to the profile summary
//     POST /api/gemini/skills    - suggest skills based on saved jobs
// ============================================================

const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { GoogleGenAI } = require('@google/genai');

// Gemini model
const strModel = 'gemini-2.5-flash';

// ============================================================
// Profile routes
// ============================================================

// GET /api/profile - returns the profile
router.get('/profile', (req, res) => {
    try {
        // Prepare() compiles the SQL query, .get() runs it and returns the first row as an object (or undefined if no rows exist)
        const objProfile = db.prepare(`SELECT * FROM tblProfile LIMIT 1`).get();
        res.status(200).json(objProfile || {});
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to retrieve profile.' });
    }
});

// POST /api/profile - creates the profile for the first time
router.post('/profile', (req, res) => {
    const { strFirstName, strLastName, strEmail, strPhone, strLocation, strSummary } = req.body;
    // Validation: first name and email are required
    if (!strFirstName || strFirstName.trim() === '') {
        return res.status(400).json({ strError: 'First name is required.' });
    }
    if (!strEmail || strEmail.trim() === '') {
        return res.status(400).json({ strError: 'Email is required.' });
    }

    try {
        const objResult = db.prepare(`
            INSERT INTO tblProfile (strFirstName, strLastName, strEmail, strPhone, strLocation, strSummary)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run( // Each value goes into the ? in order. If a value is optional, check if it exists, otherwise pass null.
            strFirstName.trim(),
            strLastName    ? strLastName.trim()    : null,
            strEmail.trim(),
            strPhone       ? strPhone.trim()       : null,
            strLocation    ? strLocation.trim()    : null,
            strSummary     ? strSummary.trim()     : null
        );
        // Sends back lastInsertRowid (auto-generated primary key of the new row) so the frontend knows the profile's ID
        res.status(201).json({ intProfileID: objResult.lastInsertRowid });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to create profile.' });
    }
});

// PUT /api/profile/:id - updates the existing profile
router.put('/profile/:id', (req, res) => {
    const intProfileID = parseInt(req.params.id);
    const { strFirstName, strLastName, strEmail, strPhone, strLocation, strSummary } = req.body;
    if (!strFirstName || strFirstName.trim() === '') {
        return res.status(400).json({ strError: 'First name is required.' });
    }
    if (!strEmail || strEmail.trim() === '') {
        return res.status(400).json({ strError: 'Email is required.' });
    }

    try {
        const objResult = db.prepare(`
            UPDATE tblProfile
            SET strFirstName = ?, strLastName = ?, strEmail = ?, strPhone = ?, strLocation = ?, strSummary = ?
            WHERE intProfileID = ?
        `).run(
            strFirstName.trim(),
            strLastName    ? strLastName.trim()    : null,
            strEmail.trim(),
            strPhone       ? strPhone.trim()       : null,
            strLocation    ? strLocation.trim()    : null,
            strSummary     ? strSummary.trim()     : null,
            intProfileID
        );

        if (objResult.changes === 0) {
            return res.status(404).json({ strError: 'Profile not found.' });
        }
        res.status(200).json({ strMessage: 'Profile updated successfully.' });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to update profile.' });
    }
});

// ============================================================
// Jobs routes
// ============================================================

// GET /api/jobs - returns all jobs
router.get('/jobs', (req, res) => {
    try {
        const arrJobs = db.prepare(`SELECT * FROM tblJobs ORDER BY strStartDate DESC`).all();
        res.status(200).json(arrJobs);
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to retrieve jobs.' });
    }
});

// POST /api/jobs - creates a new job
router.post('/jobs', (req, res) => {
    const { strCompany, strTitle, strStartDate, strEndDate, strLocation } = req.body;
    // Validation: company and title are required
    if (!strCompany || strCompany.trim() === '') {
        return res.status(400).json({ strError: 'Company is required.' });
    }
    if (!strTitle || strTitle.trim() === '') {
        return res.status(400).json({ strError: 'Job title is required.' });
    }

    try {
        const objResult = db.prepare(`
            INSERT INTO tblJobs (strCompany, strTitle, strStartDate, strEndDate, strLocation)
            VALUES (?, ?, ?, ?, ?)
        `).run(
            strCompany.trim(),
            strTitle.trim(),
            strStartDate ? strStartDate.trim() : null,
            strEndDate   ? strEndDate.trim()   : null,
            strLocation  ? strLocation.trim()  : null
        );
        res.status(201).json({ intJobID: objResult.lastInsertRowid });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to create job.' });
    }
});

// PUT /api/jobs/:id - updates an existing job
router.put('/jobs/:id', (req, res) => {
    const intJobID = parseInt(req.params.id);
    const { strCompany, strTitle, strStartDate, strEndDate, strLocation } = req.body;
    if (!strCompany || strCompany.trim() === '') {
        return res.status(400).json({ strError: 'Company is required.' });
    }
    if (!strTitle || strTitle.trim() === '') {
        return res.status(400).json({ strError: 'Job title is required.' });
    }

    try {
        const objResult = db.prepare(`
            UPDATE tblJobs
            SET strCompany = ?, strTitle = ?, strStartDate = ?, strEndDate = ?, strLocation = ?
            WHERE intJobID = ?
        `).run(
            strCompany.trim(),
            strTitle.trim(),
            strStartDate ? strStartDate.trim() : null,
            strEndDate   ? strEndDate.trim()   : null,
            strLocation  ? strLocation.trim()  : null,
            intJobID
        );

        if (objResult.changes === 0) {
            return res.status(404).json({ strError: 'Job not found.' });
        }
        res.status(200).json({ strMessage: 'Job updated successfully.' });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to update job.' });
    }
});

// DELETE /api/jobs/:id - deletes a job and all its responsibilities
router.delete('/jobs/:id', (req, res) => {
    const intJobID = parseInt(req.params.id);

    try {
        // Delete responsibilities first to avoid foreign key conflicts
        db.prepare(`DELETE FROM tblResponsibilities WHERE intJobID = ?`).run(intJobID);

        const objResult = db.prepare(`DELETE FROM tblJobs WHERE intJobID = ?`).run(intJobID);

        if (objResult.changes === 0) {
            return res.status(404).json({ strError: 'Job not found.' });
        }
        res.status(200).json({ strMessage: 'Job deleted successfully.' });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to delete job.' });
    }
});

// ============================================================
// Responsibilities routes
// ============================================================

// GET /api/responsibilities?intJobID=1 - returns responsibilities for a job
router.get('/responsibilities', (req, res) => {
    const intJobID = parseInt(req.query.intJobID);

    if (!intJobID) {
        return res.status(400).json({ strError: 'intJobID query parameter is required.' });
    }

    try {
        // Get all responsibilities for the specified job ID
        const arrResponsibilities = db.prepare(`
            SELECT * FROM tblResponsibilities WHERE intJobID = ?
        `).all(intJobID);
        res.status(200).json(arrResponsibilities);
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to retrieve responsibilities.' });
    }
});

// POST /api/responsibilities - adds a responsibility to a job
router.post('/responsibilities', (req, res) => {
    const { intJobID, strDescription } = req.body;
    if (!intJobID) {
        return res.status(400).json({ strError: 'intJobID is required.' });
    }
    if (!strDescription || strDescription.trim() === '') {
        return res.status(400).json({ strError: 'Description is required.' });
    }

    try {
        const objResult = db.prepare(`
            INSERT INTO tblResponsibilities (intJobID, strDescription) VALUES (?, ?)
        `).run(intJobID, strDescription.trim());
        res.status(201).json({ intResponsibilityID: objResult.lastInsertRowid });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to add responsibility.' });
    }
});

// PUT /api/responsibilities/:id - updates a responsibility
router.put('/responsibilities/:id', (req, res) => {
    const intResponsibilityID = parseInt(req.params.id);
    const { strDescription } = req.body;

    if (!strDescription || strDescription.trim() === '') {
        return res.status(400).json({ strError: 'Description is required.' });
    }

    try {
        const objResult = db.prepare(`
            UPDATE tblResponsibilities SET strDescription = ? WHERE intResponsibilityID = ?
        `).run(strDescription.trim(), intResponsibilityID);

        if (objResult.changes === 0) {
            return res.status(404).json({ strError: 'Responsibility not found.' });
        }
        res.status(200).json({ strMessage: 'Responsibility updated successfully.' });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to update responsibility.' });
    }
});

// DELETE /api/responsibilities/:id - deletes a responsibility
router.delete('/responsibilities/:id', (req, res) => {
    const intResponsibilityID = parseInt(req.params.id);

    try {
        const objResult = db.prepare(`DELETE FROM tblResponsibilities WHERE intResponsibilityID = ?`).run(intResponsibilityID);

        if (objResult.changes === 0) {
            return res.status(404).json({ strError: 'Responsibility not found.' });
        }
        res.status(200).json({ strMessage: 'Responsibility deleted successfully.' });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to delete responsibility.' });
    }
});


// ============================================================
// Education routes
// ============================================================

// GET /api/education - returns all education entries
router.get('/education', (req, res) => {
    try {
        const arrEducation = db.prepare(`SELECT * FROM tblEducation ORDER BY strGradYear DESC`).all();
        res.status(200).json(arrEducation);
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to retrieve education.' });
    }
});

// POST /api/education - creates an education entry
router.post('/education', (req, res) => {
    const { strSchool, strDegree, strFieldOfStudy, strGradYear } = req.body;

    if (!strSchool || strSchool.trim() === '') {
        return res.status(400).json({ strError: 'School name is required.' });
    }

    try {
        const objResult = db.prepare(`
            INSERT INTO tblEducation (strSchool, strDegree, strFieldOfStudy, strGradYear)
            VALUES (?, ?, ?, ?)
        `).run(
            strSchool.trim(),
            strDegree       ? strDegree.trim()       : null,
            strFieldOfStudy ? strFieldOfStudy.trim() : null,
            strGradYear     ? strGradYear.trim()     : null
        );
        res.status(201).json({ intEducationID: objResult.lastInsertRowid });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to create education entry.' });
    }
});

// DELETE /api/education/:id - deletes an education entry
router.delete('/education/:id', (req, res) => {
    const intEducationID = parseInt(req.params.id);

    try {
        const objResult = db.prepare(`DELETE FROM tblEducation WHERE intEducationID = ?`).run(intEducationID);

        if (objResult.changes === 0) {
            return res.status(404).json({ strError: 'Education entry not found.' });
        }
        res.status(200).json({ strMessage: 'Education entry deleted successfully.' });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to delete education entry.' });
    }
});

// ============================================================
// Skills routes
// ============================================================

// GET /api/skills - returns all skills
router.get('/skills', (req, res) => {
    try {
        const arrSkills = db.prepare(`SELECT * FROM tblSkills ORDER BY strCategory, strName`).all();
        res.status(200).json(arrSkills);
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to retrieve skills.' });
    }
});

// POST /api/skills - creates a skill
router.post('/skills', (req, res) => {
    const { strName, strCategory } = req.body;

    if (!strName || strName.trim() === '') {
        return res.status(400).json({ strError: 'Skill name is required.' });
    }

    try {
        const objResult = db.prepare(`
            INSERT INTO tblSkills (strName, strCategory) VALUES (?, ?)
        `).run(strName.trim(), strCategory ? strCategory.trim() : null);
        res.status(201).json({ intSkillID: objResult.lastInsertRowid });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to create skill.' });
    }
});

// DELETE /api/skills/:id - deletes a skill
router.delete('/skills/:id', (req, res) => {
    const intSkillID = parseInt(req.params.id);

    try {
        const objResult = db.prepare(`DELETE FROM tblSkills WHERE intSkillID = ?`).run(intSkillID);

        if (objResult.changes === 0) {
            return res.status(404).json({ strError: 'Skill not found.' });
        }
        res.status(200).json({ strMessage: 'Skill deleted successfully.' });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to delete skill.' });
    }
});

// ============================================================
// Certifications routes
// ============================================================

// GET /api/certs - returns all certifications
router.get('/certs', (req, res) => {
    try {
        const arrCerts = db.prepare(`SELECT * FROM tblCertifications ORDER BY strDate DESC`).all();
        res.status(200).json(arrCerts);
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to retrieve certifications.' });
    }
});

// POST /api/certs - creates a certification
router.post('/certs', (req, res) => {
    const { strName, strIssuer, strDate } = req.body;

    if (!strName || strName.trim() === '') {
        return res.status(400).json({ strError: 'Certification name is required.' });
    }

    try {
        const objResult = db.prepare(`
            INSERT INTO tblCertifications (strName, strIssuer, strDate) VALUES (?, ?, ?)
        `).run(
            strName.trim(),
            strIssuer ? strIssuer.trim() : null,
            strDate   ? strDate.trim()   : null
        );
        res.status(201).json({ intCertID: objResult.lastInsertRowid });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to create certification.' });
    }
});

// DELETE /api/certs/:id - deletes a certification
router.delete('/certs/:id', (req, res) => {
    const intCertID = parseInt(req.params.id);

    try {
        const objResult = db.prepare(`DELETE FROM tblCertifications WHERE intCertID = ?`).run(intCertID);

        if (objResult.changes === 0) {
            return res.status(404).json({ strError: 'Certification not found.' });
        }
        res.status(200).json({ strMessage: 'Certification deleted successfully.' });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to delete certification.' });
    }
});

// ============================================================
// Awards routes
// ============================================================

// GET /api/awards - returns all awards
router.get('/awards', (req, res) => {
    try {
        const arrAwards = db.prepare(`SELECT * FROM tblAwards ORDER BY strDate DESC`).all();
        res.status(200).json(arrAwards);
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to retrieve awards.' });
    }
});

// POST /api/awards - creates an award
router.post('/awards', (req, res) => {
    const { strName, strIssuer, strDate, strDescription } = req.body;

    if (!strName || strName.trim() === '') {
        return res.status(400).json({ strError: 'Award name is required.' });
    }

    try {
        const objResult = db.prepare(`
            INSERT INTO tblAwards (strName, strIssuer, strDate, strDescription) VALUES (?, ?, ?, ?)
        `).run(
            strName.trim(),
            strIssuer      ? strIssuer.trim()      : null,
            strDate        ? strDate.trim()        : null,
            strDescription ? strDescription.trim() : null
        );
        res.status(201).json({ intAwardID: objResult.lastInsertRowid });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to create award.' });
    }
});

// DELETE /api/awards/:id - deletes an award
router.delete('/awards/:id', (req, res) => {
    const intAwardID = parseInt(req.params.id);

    try {
        const objResult = db.prepare(`DELETE FROM tblAwards WHERE intAwardID = ?`).run(intAwardID);

        if (objResult.changes === 0) {
            return res.status(404).json({ strError: 'Award not found.' });
        }
        res.status(200).json({ strMessage: 'Award deleted successfully.' });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to delete award.' });
    }
});

// ============================================================
// Settings routes
// ============================================================

// GET /api/settings - returns the settings row
router.get('/settings', (req, res) => {
    try {
        const objSettings = db.prepare(`SELECT * FROM tblSettings LIMIT 1`).get();
        res.status(200).json(objSettings || {});
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to retrieve settings.' });
    }
});

// PUT /api/settings - updates the settings row
// Accepts strGeminiApiKey and/or strResumeFont in the request body
router.put('/settings', (req, res) => {
    const { strGeminiApiKey, strResumeFont } = req.body;

    try {
        db.prepare(`
            UPDATE tblSettings
            SET strGeminiApiKey = ?, strResumeFont = ?
        `).run(
            // If the value doesnt exists, for the API key, set to null, and for the font, default to 'Arial'.
            strGeminiApiKey ? strGeminiApiKey.trim() : null,
            strResumeFont   ? strResumeFont.trim()   : 'Arial'
        );

        res.status(200).json({ strMessage: 'Settings saved successfully.' });
    } catch (objError) {
        res.status(500).json({ strError: 'Failed to save settings.' });
    }
});

// ============================================================
// Gemini AI routes
// ============================================================
// AI-assisted section
// POST /api/gemini/suggest - reviews profile summary and returns suggestions
router.post('/gemini/suggest', async (req, res) => {
    const { strText } = req.body;

    if (!strText || strText.trim() === '') {
        return res.status(400).json({ strError: 'Text to review is required.' });
    }

    // Get API key - prefer the one saved in DB, fall back to .env
    let strApiKey = process.env.GEMINI_API_KEY;
    try {
        const objSetting = db.prepare(`SELECT strGeminiApiKey FROM tblSettings LIMIT 1`).get();
        if (objSetting && objSetting.strGeminiApiKey) strApiKey = objSetting.strGeminiApiKey;
    } catch (objError) {}

    if (!strApiKey) {
        return res.status(400).json({ strError: 'No Gemini API key found. Please add one in Settings.' });
    }

    const strPrompt = `You are a professional resume coach. Review the following professional summary and provide 2-3 concise, actionable suggestions to improve it for a job application. Be specific and professional. Keep your response brief and formatted as a short list.

Text to review:
"${strText.trim()}"`;

    try {
        const objGenAI = new GoogleGenAI({ apiKey: strApiKey });
        // generateContent() sends the prompt to Gemini and returns the response
        const objResponse = await objGenAI.models.generateContent({
            model: strModel,
            contents: strPrompt
        });

        const strSuggestion = objResponse.text;

        if (!strSuggestion) {
            return res.status(502).json({ strError: 'No suggestion returned from Gemini.' });
        }

        res.status(200).json({ strSuggestion });
    } catch (objError) {
        res.status(500).json({ strError: 'Gemini error: ' + objError.message });
    }
});

// POST /api/gemini/skills - suggests skills based on the user's job entries
router.post('/gemini/skills', async (req, res) => {
    const { strJobList } = req.body;

    if (!strJobList || strJobList.trim() === '') {
        return res.status(400).json({ strError: 'Job list is required.' });
    }

    let strApiKey = process.env.GEMINI_API_KEY;
    try {
        const objSetting = db.prepare(`SELECT strGeminiApiKey FROM tblSettings LIMIT 1`).get();
        if (objSetting && objSetting.strGeminiApiKey) strApiKey = objSetting.strGeminiApiKey;
    } catch (objError) {}

    if (!strApiKey) {
        return res.status(400).json({ strError: 'No Gemini API key found. Please add one in Settings.' });
    }

    const strPrompt = `You are a professional resume coach. Based on the following work experience, suggest 8-10 relevant skills to include on a resume. Be specific and practical. Format your response as a simple list with no extra explanation.

Work experience:
${strJobList.trim()}`;

    try {
        const objGenAI = new GoogleGenAI({ apiKey: strApiKey });
        // sends the prompt to Gemini and returns the response
        const objResponse = await objGenAI.models.generateContent({
            model: strModel,
            contents: strPrompt
        });

        const strSuggestion = objResponse.text;

        if (!strSuggestion) {
            return res.status(502).json({ strError: 'No suggestion returned from Gemini.' });
        }

        res.status(200).json({ strSuggestion });
    } catch (objError) {
        res.status(500).json({ strError: 'Gemini error: ' + objError.message });
    }
});

module.exports = router;
