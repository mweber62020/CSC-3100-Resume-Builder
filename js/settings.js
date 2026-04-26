// ============================================================
// settings.js - Frontend logic for the Settings section
//
// Loads saved settings and wires up each save button.
// All settings are stored in a single row in tblSettings.
// Each save button sends a PUT with the full settings object.
// ============================================================

const strSettingsApiUrl = '/api/settings';

// Holds the current settings so each individual save button
// can send the full row without overwriting unrelated fields
let objCurrentSettings = {
    strGeminiApiKey: null,
    strResumeFont: 'Arial'
};

// ------------------------------------------------------------
// loadSettings()
// Fetches the settings row and populates the form fields.
// Called when the Settings nav link is clicked.
// ------------------------------------------------------------
async function loadSettings() {
    try {
        const objResponse = await fetch(strSettingsApiUrl);
        const objSettings = await objResponse.json();

        // Store the current values so saves can send the full row
        objCurrentSettings = objSettings;

        // Mask the API key - just update the placeholder if one is saved
        if (objSettings.strGeminiApiKey) {
            document.querySelector('#txtApiKey').placeholder = 'API key is saved — paste a new one to replace it';
        }

        // Populate the font dropdown with the saved value
        if (objSettings.strResumeFont) {
            document.querySelector('#cboFont').value = objSettings.strResumeFont;
        }

        // Dark mode is handled by app.js via localStorage
        const strTheme = localStorage.getItem('theme') || 'light';
        document.querySelector('#chkDarkMode').checked = (strTheme === 'dark');

    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not load settings.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// saveSettings(objUpdated)
// Sends a PUT with the full settings row. Merges the updated
// field(s) into the current settings so nothing gets wiped.
// @param {object} objUpdated - the field(s) being changed
// ------------------------------------------------------------
async function saveSettings(objUpdated) {
    // Merge the change into the current settings before sending
    const objToSave = { ...objCurrentSettings, ...objUpdated };

    try {
        const objResponse = await fetch(strSettingsApiUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(objToSave)
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
            return false;
        }

        // Keep the local copy in sync
        objCurrentSettings = objToSave;
        return true;

    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not save settings.', icon: 'error' });
        return false;
    }
}

// ------------------------------------------------------------
// saveApiKey()
// Saves the Gemini API key and clears the input field.
// ------------------------------------------------------------
async function saveApiKey() {
    const strApiKey = document.querySelector('#txtApiKey').value.trim();

    if (strApiKey === '') {
        Swal.fire({ title: 'Missing Field', text: 'Please paste your Gemini API key.', icon: 'warning' });
        return;
    }

    const blnSuccess = await saveSettings({ strGeminiApiKey: strApiKey });

    if (blnSuccess) {
        document.querySelector('#txtApiKey').value = '';
        document.querySelector('#txtApiKey').placeholder = 'API key is saved — paste a new one to replace it';
        Swal.fire({ title: 'Saved!', text: 'API key saved.', icon: 'success', timer: 1500, showConfirmButton: false });
    }
}

// ------------------------------------------------------------
// saveFont()
// Saves the selected resume font.
// ------------------------------------------------------------
async function saveFont() {
    const strFont = document.querySelector('#cboFont').value;

    const blnSuccess = await saveSettings({ strResumeFont: strFont });

    if (blnSuccess) {
        Swal.fire({ title: 'Saved!', text: `Font set to ${strFont}.`, icon: 'success', timer: 1500, showConfirmButton: false });
    }
}

// ------------------------------------------------------------
// Wire up buttons once the DOM is ready
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnSaveApiKey').addEventListener('click', saveApiKey);
    document.querySelector('#btnSaveFont').addEventListener('click', saveFont);
});
