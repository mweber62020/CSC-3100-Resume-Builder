// ============================================================
// app.js - Main controller for application
// Handles showing and hiding sections when the user clicks nav links.
// ============================================================

// List of all section IDs in the app.
const arrSections = [
    'divHome',
    'divProfile',
    'divEducation',
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
// Dark Mode Toggle
// ------------------------------------------------------------
// AI-assisted section
// Apply the saved theme on initial load. Default to 'light' if nothing saved.
const strSavedTheme = localStorage.getItem('theme') || 'light';
document.documentElement.setAttribute('data-bs-theme', strSavedTheme);

// Once the page is ready, sync the toggle to match the saved theme
document.addEventListener('DOMContentLoaded', () => {
    const chkDarkMode = document.querySelector('#chkDarkMode');
    // Check if dark mode is active
    chkDarkMode.checked = (strSavedTheme === 'dark');
    // Listen for the toggle
    chkDarkMode.addEventListener('change', () => {
        // Pick the new theme
        const strTheme = chkDarkMode.checked ? 'dark' : 'light';
        // Apply it immediately
        document.documentElement.setAttribute('data-bs-theme', strTheme);
        // Save to localStorage so it persists on refresh
        localStorage.setItem('theme', strTheme);
    });
});
