// ============================================================
// gemini.js - Frontend logic for AI suggestions
//
// Provides a reusable function getAISuggestion() that any
// section can call to request a Gemini suggestion and display
// it in a target element.
//
// Currently wired to the Profile summary field.
// Can be reused for job responsibilities by passing different
// element IDs and a context label.
// ============================================================

const strGeminiApiUrl = '/api/gemini/suggest';

// ------------------------------------------------------------
// getAISuggestion(strInputID, strOutputID, strContext)
// Reads text from an input/textarea, sends it to the Gemini
// backend route, and displays the suggestion in a target div.
//
// @param {string} strInputID  - ID of the textarea/input to read from
// @param {string} strOutputID - ID of the div to show the suggestion in
// @param {string} strContext  - describes what the text is, e.g.
//                               "professional summary" or "job responsibility"
// ------------------------------------------------------------
async function getAISuggestion(strInputID, strOutputID, strContext) {
    const strText = document.querySelector(`#${strInputID}`).value.trim();

    if (strText === '') {
        Swal.fire({
            title: 'Nothing to Review',
            text: `Please enter your ${strContext} before requesting suggestions.`,
            icon: 'warning'
        });
        return;
    }

    const divOutput = document.querySelector(`#${strOutputID}`);

    // Show a loading state so the user knows something is happening.
    // Gemini can take a second or two to respond.
    divOutput.classList.remove('d-none');
    divOutput.innerHTML = '<span aria-live="polite">Getting suggestions...</span>';

    try {
        const objResponse = await fetch(strGeminiApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strText, strContext })
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            divOutput.innerHTML = `<strong>Error:</strong> ${objData.strError}`;
            return;
        }

        // Convert newlines in the response to <br> tags so the
        // formatted list renders properly in the browser
        const strFormatted = objData.strSuggestion.replace(/\n/g, '<br>');
        divOutput.innerHTML = `<strong>AI Suggestions:</strong><br><br>${strFormatted}`;

    } catch (objError) {
        divOutput.innerHTML = '<strong>Error:</strong> Could not reach the suggestion service.';
    }
}

// ------------------------------------------------------------
// Wire up the Get AI Suggestions button on the Profile page
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnSuggestProfile').addEventListener('click', () => {
        // Pass the summary textarea ID, the suggestion box ID, and
        // a context label so Gemini knows what it's reviewing
        getAISuggestion('txtSummary', 'divProfileSuggestion', 'professional summary');
    });
});
