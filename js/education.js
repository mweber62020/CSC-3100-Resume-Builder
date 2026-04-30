// ============================================================
// education.js - Frontend logic for the Education section
// Handles adding, displaying, and deleting education entries.
// ============================================================

// API endpoint for education
const strEducationApiUrl = '/api/education';

// ------------------------------------------------------------
// loadEducation()
// Fetches all education entries from the API and renders them.
// ------------------------------------------------------------
async function loadEducation() {
    try {
        const objResponse = await fetch(strEducationApiUrl);
        const arrEducation = await objResponse.json();
        renderEducation(arrEducation);
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not load education.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// renderEducation(arrEducation)
// Builds the education list in the DOM.
// Accepts an array of education objects from the API.
// ------------------------------------------------------------
function renderEducation(arrEducation) {
    const divEducationList = document.querySelector('#divEducationList');

    if (arrEducation.length === 0) {
        divEducationList.innerHTML = '<p class="text-muted">No education added yet.</p>';
        return;
    }

    divEducationList.innerHTML = arrEducation.map((objEdu) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2"
            aria-label="Education: ${objEdu.strSchool}">
            <div>
                <strong>${objEdu.strSchool}</strong>
                <span class="text-muted ms-2 small">
                    ${objEdu.strDegree ? objEdu.strDegree : ''}
                    ${objEdu.strFieldOfStudy ? '&bull; ' + objEdu.strFieldOfStudy : ''}
                    ${objEdu.strGradYear ? '&bull; ' + objEdu.strGradYear : ''}
                </span>
            </div>
            <button class="btn btn-sm btn-outline-danger ms-2"
                aria-label="Delete education ${objEdu.strSchool}"
                onclick="deleteEducation(${objEdu.intEducationID})">
                &times;
            </button>
        </div>
    `).join('');
}

// ------------------------------------------------------------
// addEducation()
// Reads the form, validates, and POSTs a new education entry.
// ------------------------------------------------------------
async function addEducation() {
    const strSchool       = document.querySelector('#txtEduSchool').value.trim();
    const strDegree       = document.querySelector('#txtEduDegree').value.trim();
    const strFieldOfStudy = document.querySelector('#txtEduField').value.trim();
    const strGradYear     = document.querySelector('#txtEduYear').value.trim();

    // Clear any previous validation and check required fields
    document.querySelector('#txtEduSchool').classList.remove('is-invalid');
    if (strSchool === '') {
        document.querySelector('#txtEduSchool').classList.add('is-invalid');
        return;
    }

    try {
        // Send the new education entry to the API
        const objResponse = await fetch(strEducationApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strSchool, strDegree, strFieldOfStudy, strGradYear })
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
            return;
        }

        // Clear the form and reload the education list
        document.querySelector('#frmAddEducation').reset();
        document.querySelector('#txtEduSchool').classList.remove('is-invalid');
        loadEducation();
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not add education.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// deleteEducation(intEducationID)
// DELETEs an education entry and reloads the list.
// ------------------------------------------------------------
async function deleteEducation(intEducationID) {
    try {
        const objResponse = await fetch(`${strEducationApiUrl}/${intEducationID}`, {
            method: 'DELETE'
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
            return;
        }

        loadEducation();
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not delete education.', icon: 'error' });
    }
}

// Onload, set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnAddEducation').addEventListener('click', addEducation);
});
