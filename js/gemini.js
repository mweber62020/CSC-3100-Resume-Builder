// ============================================================
// gemini.js - Frontend logic for AI suggestions
// Two suggestion functions for the profile summary and skills.
// ============================================================

// API endpoints for Gemini suggestions
const strGeminiSuggestUrl = '/api/gemini/suggest';
const strGeminiSkillsUrl  = '/api/gemini/skills';

// ------------------------------------------------------------
// suggestProfileSummary()
// Reads the profile summary, sends to Gemini, and displays suggestions.
// ------------------------------------------------------------
async function suggestProfileSummary() {
    const strText = document.querySelector('#txtSummary').value.trim();

    if (strText === '') {
        Swal.fire({ title: 'Nothing to Review', text: 'Please enter a summary before requesting suggestions.', icon: 'warning' });
        return;
    }

    const divOutput = document.querySelector('#divProfileSuggestion');

    // Show a loading state while waiting for Gemini to respond
    divOutput.classList.remove('d-none');
    divOutput.innerHTML = '<span aria-live="polite">Getting suggestions...</span>';

    try {
        const objResponse = await fetch(strGeminiSuggestUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strText })
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            divOutput.innerHTML = `<strong>Error:</strong> ${objData.strError}`;
            return;
        }

        // Convert newlines to <br> tags so the list renders properly in the browser
        const strFormatted = objData.strSuggestion.replace(/\n/g, '<br>');
        divOutput.innerHTML = `<strong>AI Suggestions:</strong><br><br>${strFormatted}`;

    } catch (objError) {
        divOutput.innerHTML = '<strong>Error:</strong> Could not reach the suggestion service.';
    }
}

// ------------------------------------------------------------
// suggestSkills()
// Fetches user's saved jobs, sends to Gemini, and displays skill suggestions.
// ------------------------------------------------------------
async function suggestSkills() {
    const divOutput = document.querySelector('#divSkillsSuggestion');

    // Show a loading state while waiting
    divOutput.classList.remove('d-none');
    divOutput.innerHTML = '<span aria-live="polite">Getting suggestions...</span>';

    try {
        // Fetch the user's saved jobs
        const objJobsResponse = await fetch('/api/jobs');
        const arrJobs = await objJobsResponse.json();

        if (arrJobs.length === 0) {
            divOutput.innerHTML = '<strong>No jobs found.</strong> Add some jobs first so Gemini has something to base suggestions on.';
            return;
        }

        // Build a string listing each job title and company
        const strJobList = arrJobs.map((objJob) => `${objJob.strTitle} at ${objJob.strCompany}`).join(', ');

        const objResponse = await fetch(strGeminiSkillsUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strJobList })
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            divOutput.innerHTML = `<strong>Error:</strong> ${objData.strError}`;
            return;
        }

        const strFormatted = objData.strSuggestion.replace(/\n/g, '<br>');
        divOutput.innerHTML = `<strong>Suggested Skills:</strong><br><br>${strFormatted}`;

    } catch (objError) {
        divOutput.innerHTML = '<strong>Error:</strong> Could not reach the suggestion service.';
    }
}

// Onload, set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnSuggestProfile').addEventListener('click', suggestProfileSummary);
    document.querySelector('#btnSuggestSkills').addEventListener('click', suggestSkills);
});
