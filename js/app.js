// ============================================================
// app.js - Main SPA controller for ResuMint
// Handles showing and hiding sections when the user clicks
// nav links. All other JS files handle their own sections.
// ============================================================

// List of all section IDs in the app.
// When adding a new section, add its ID here.
const arrSections = [
    'divHome',
    'divProfile',
    'divJobs',
    'divSkills',
    'divCertifications',
    'divAwards',
    'divResume',
    'divSettings'
];

// ------------------------------------------------------------
// showSection()
// Hides all sections, then shows the one that was requested.
// Called by onclick on each nav link in index.html.
// @param {string} strSectionID - the ID of the section to show
// ------------------------------------------------------------
function showSection(strSectionID) {
    // Loop through every section and hide it
    arrSections.forEach((strID) => {
        document.querySelector(`#${strID}`).classList.add('d-none');
    });

    // Show only the requested section
    document.querySelector(`#${strSectionID}`).classList.remove('d-none');
}

// ------------------------------------------------------------
// Dark Mode
// Bootstrap 5.3 supports dark mode via the data-bs-theme
// attribute on the <html> element. Setting it to 'dark' or
// 'light' is all that's needed — Bootstrap handles the rest.
//
// We save the preference to localStorage so it survives a
// page refresh without needing a server round trip.
// (The Settings API will also save it to the DB later.)
// ------------------------------------------------------------

// Apply the saved theme as early as possible so there's no
// flash of the wrong theme when the page loads
const strSavedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-bs-theme', strSavedTheme);

// Once the DOM is ready, sync the toggle switch to match the
// saved theme so it reflects the current state on load
document.addEventListener('DOMContentLoaded', () => {
    const chkDarkMode = document.querySelector('#chkDarkMode');

    // Check the toggle if dark mode is currently active
    chkDarkMode.checked = (strSavedTheme === 'dark');

    // Listen for the user flipping the toggle
    chkDarkMode.addEventListener('change', () => {
        // Pick the new theme based on whether the box is checked
        const strTheme = chkDarkMode.checked ? 'dark' : 'light';

        // Apply it immediately to the page
        document.documentElement.setAttribute('data-bs-theme', strTheme);

        // Save to localStorage so it persists on refresh
        localStorage.setItem('theme', strTheme);
    });
});
