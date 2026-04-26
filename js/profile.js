// ============================================================
// profile.js - Frontend logic for the Profile section
//
// The profile is a single record. On load we check if one
// exists and populate the form. On save we POST if it's new
// or PUT if it already exists.
//
// We store the profile ID in a variable so we know which
// record to update when the user saves changes.
// ============================================================

const strProfileApiUrl = '/api/profile';

// Holds the profile ID once the profile has been saved.
// null means no profile exists yet — first save will POST.
// Any number means a profile exists — subsequent saves PUT.
let intCurrentProfileID = null;

// ------------------------------------------------------------
// loadProfile()
// Fetches the profile from the API and populates the form.
// Called when the Profile nav link is clicked.
// ------------------------------------------------------------
async function loadProfile() {
    try {
        const objResponse = await fetch(strProfileApiUrl);
        const objProfile = await objResponse.json();

        // If an intProfileID exists, a profile has been saved before
        if (objProfile.intProfileID) {
            intCurrentProfileID = objProfile.intProfileID;

            // Populate each form field with the saved value
            document.querySelector('#txtFirstName').value = objProfile.strFirstName || '';
            document.querySelector('#txtLastName').value  = objProfile.strLastName  || '';
            document.querySelector('#txtEmail').value     = objProfile.strEmail     || '';
            document.querySelector('#txtPhone').value     = objProfile.strPhone     || '';
            document.querySelector('#txtLocation').value  = objProfile.strLocation  || '';
            document.querySelector('#txtSummary').value   = objProfile.strSummary   || '';
        }
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not load profile.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// saveProfile()
// Reads the form values, validates them, then either POSTs
// (first save) or PUTs (update) depending on whether a profile
// already exists.
// ------------------------------------------------------------
async function saveProfile() {
    const strFirstName = document.querySelector('#txtFirstName').value.trim();
    const strLastName  = document.querySelector('#txtLastName').value.trim();
    const strEmail     = document.querySelector('#txtEmail').value.trim();
    const strPhone     = document.querySelector('#txtPhone').value.trim();
    const strLocation  = document.querySelector('#txtLocation').value.trim();
    const strSummary   = document.querySelector('#txtSummary').value.trim();

    // Client-side validation
    if (strFirstName === '') {
        Swal.fire({ title: 'Missing Field', text: 'First name is required.', icon: 'warning' });
        return;
    }
    if (strEmail === '') {
        Swal.fire({ title: 'Missing Field', text: 'Email is required.', icon: 'warning' });
        return;
    }

    // Build the request body - same fields for both POST and PUT
    const objBody = { strFirstName, strLastName, strEmail, strPhone, strLocation, strSummary };

    try {
        let objResponse;

        if (intCurrentProfileID === null) {
            // No profile yet - create it with POST
            objResponse = await fetch(strProfileApiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(objBody)
            });

            const objData = await objResponse.json();

            if (!objResponse.ok) {
                Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
                return;
            }

            // Store the new profile ID so future saves use PUT
            intCurrentProfileID = objData.intProfileID;

        } else {
            // Profile exists - update it with PUT
            objResponse = await fetch(`${strProfileApiUrl}/${intCurrentProfileID}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(objBody)
            });

            const objData = await objResponse.json();

            if (!objResponse.ok) {
                Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
                return;
            }
        }

        Swal.fire({ title: 'Saved!', text: 'Your profile has been saved.', icon: 'success', timer: 1500, showConfirmButton: false });

    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not save profile.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// Wire up buttons and load profile once the DOM is ready
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnSaveProfile').addEventListener('click', saveProfile);

    // Load the profile immediately so the form is pre-filled on arrival
    loadProfile();
});
