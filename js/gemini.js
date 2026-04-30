// ============================================================
// gemini.js - Frontend logic for AI suggestions
// Provides a reusable function getAISuggestion() that any section can call
// ============================================================

const strGeminiApiUrl = '/api/gemini/suggest';

// ------------------------------------------------------------
// getAISuggestion(strInputID, strOutputID, strContext)
// Reads text from a textarea, sends it to the Gemini backend, and displays the suggestion in a target div.
// strContext describes what the text is so the route can be reused for other fields.
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
    divOutput.classList.remove('d-none');
    divOutput.innerHTML = '<span aria-live="polite">Getting suggestions...</span>';

    try {
        // Send the text and context to the API
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

        // Convert newlines in the response to <br> tags so the formatted list renders properly in the browser
        const strFormatted = objData.strSuggestion.replace(/\n/g, '<br>');
        divOutput.innerHTML = `<strong>AI Suggestions:</strong><br><br>${strFormatted}`;

    } catch (objError) {
        divOutput.innerHTML = '<strong>Error:</strong> Could not reach the suggestion service.';
    }
}

// Onload, set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnSuggestProfile').addEventListener('click', () => {
        // Pass the summary textarea ID, the suggestion box ID, and a context label so it knows what to review
        getAISuggestion('txtSummary', 'divProfileSuggestion', 'professional summary');
    });
});
