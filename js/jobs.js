// ============================================================
// jobs.js - Frontend logic for the Jobs section
//
// Handles adding, displaying, and deleting jobs and their
// responsibilities. Communicates with the backend via fetch().
//
// Functions:
//   loadJobs()                        - fetches and renders all jobs
//   renderJobs(arrJobs)               - builds the job cards in the DOM
//   loadResponsibilities(intJobID)    - fetches and renders responsibilities for one job
//   addJob()                          - reads the form and POSTs a new job
//   deleteJob(intJobID)               - DELETEs a job and refreshes the list
//   addResponsibility(intJobID)       - POSTs a new responsibility for a job
//   deleteResponsibility(intRespID, intJobID) - DELETEs a responsibility
// ============================================================

// Base URL for all API calls in this file
const strJobsApiUrl = '/api/jobs';
const strRespApiUrl = '/api/responsibilities';

// ------------------------------------------------------------
// loadJobs()
// Fetches all jobs from the API and renders them on the page.
// Called once when the Jobs section is first shown, and again
// after any add or delete to keep the list up to date.
// ------------------------------------------------------------
async function loadJobs() {
    try {
        const objResponse = await fetch(strJobsApiUrl);
        const arrJobs = await objResponse.json();
        renderJobs(arrJobs);
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not load jobs.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// renderJobs(arrJobs)
// Builds and injects HTML job cards into divJobList.
// Each card shows the job details and a responsibilities section.
// @param {Array} arrJobs - array of job objects from the API
// ------------------------------------------------------------
function renderJobs(arrJobs) {
    const divJobList = document.querySelector('#divJobList');

    // If there are no jobs yet, show a simple message
    if (arrJobs.length === 0) {
        divJobList.innerHTML = '<p class="text-muted">No jobs added yet.</p>';
        return;
    }

    // Build a card for each job
    // Template literals let us write HTML as a string cleanly
    divJobList.innerHTML = arrJobs.map((objJob) => `
        <div class="card mb-3" id="divJob_${objJob.intJobID}" aria-label="Job: ${objJob.strTitle} at ${objJob.strCompany}">
            <div class="card-header d-flex justify-content-between align-items-center">
                <span>
                    <strong>${objJob.strTitle}</strong> &mdash; ${objJob.strCompany}
                    <span class="text-muted ms-2 small">
                        ${objJob.strStartDate || ''} ${objJob.strEndDate ? '&ndash; ' + objJob.strEndDate : ''}
                        ${objJob.strLocation ? '&bull; ' + objJob.strLocation : ''}
                    </span>
                </span>
                <!-- Delete button for this job -->
                <button class="btn btn-sm btn-outline-danger" aria-label="Delete job ${objJob.strTitle}"
                    onclick="deleteJob(${objJob.intJobID})">Delete</button>
            </div>
            <div class="card-body">

                <!-- Responsibilities list for this job - filled by loadResponsibilities() -->
                <div id="divRespList_${objJob.intJobID}" aria-label="Responsibilities for ${objJob.strTitle}" aria-live="polite">
                    <p class="text-muted small">Loading responsibilities...</p>
                </div>

                <!-- Form to add a new responsibility to this job -->
                <div class="input-group mt-2">
                    <input type="text" class="form-control form-control-sm"
                        id="txtResp_${objJob.intJobID}"
                        aria-label="New responsibility for ${objJob.strTitle}"
                        placeholder="Add a responsibility..." />
                    <button class="btn btn-sm btn-outline-primary" aria-label="Add responsibility"
                        onclick="addResponsibility(${objJob.intJobID})">Add</button>
                </div>

            </div>
        </div>
    `).join('');

    // After rendering all job cards, load responsibilities for each one
    arrJobs.forEach((objJob) => {
        loadResponsibilities(objJob.intJobID);
    });
}

// ------------------------------------------------------------
// loadResponsibilities(intJobID)
// Fetches responsibilities for one job and renders them inside
// that job's card. Called after each job card is rendered.
// @param {number} intJobID - the ID of the job to load for
// ------------------------------------------------------------
async function loadResponsibilities(intJobID) {
    try {
        // Pass intJobID as a query string per API conventions
        const objResponse = await fetch(`${strRespApiUrl}?intJobID=${intJobID}`);
        const arrResps = await objResponse.json();

        const divRespList = document.querySelector(`#divRespList_${intJobID}`);

        if (arrResps.length === 0) {
            divRespList.innerHTML = '<p class="text-muted small">No responsibilities added yet.</p>';
            return;
        }

        // Render each responsibility as a simple row with a border bottom.
        // Avoiding list-group here because the Pulse theme applies a dark
        // background to list-group-item that clashes with the card body.
        divRespList.innerHTML = arrResps.map((objResp) => `
            <div class="d-flex justify-content-between align-items-center border-bottom py-1"
                aria-label="Responsibility: ${objResp.strDescription}">
                <span class="small">${objResp.strDescription}</span>
                <button class="btn btn-sm btn-outline-danger ms-2"
                    aria-label="Delete responsibility"
                    onclick="deleteResponsibility(${objResp.intResponsibilityID}, ${intJobID})">
                    &times;
                </button>
            </div>
        `).join('');
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not load responsibilities.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// addJob()
// Reads values from the Add Job form, validates them, and
// POSTs a new job to the API. Reloads the list on success.
// Called by the Add Job button in index.html.
// ------------------------------------------------------------
async function addJob() {
    // Read and trim all form values
    const strCompany  = document.querySelector('#txtJobCompany').value.trim();
    const strTitle    = document.querySelector('#txtJobTitle').value.trim();
    const strStart    = document.querySelector('#txtJobStart').value.trim();
    const strEnd      = document.querySelector('#txtJobEnd').value.trim();
    const strLocation = document.querySelector('#txtJobLocation').value.trim();

    // Client-side validation before hitting the API
    if (strCompany === '' || strTitle === '') {
        Swal.fire({ title: 'Missing Fields', text: 'Company and Job Title are required.', icon: 'warning' });
        return;
    }

    try {
        const objResponse = await fetch(strJobsApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Send data as JSON in the request body per API conventions
            body: JSON.stringify({
                strCompany,
                strTitle,
                strStartDate: strStart,
                strEndDate: strEnd,
                strLocation
            })
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
            return;
        }

        // Clear the form fields after a successful add
        document.querySelector('#frmAddJob').reset();

        // Reload the jobs list to show the new entry
        loadJobs();

    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not add job.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// deleteJob(intJobID)
// Asks the user to confirm, then DELETEs the job and reloads.
// @param {number} intJobID - the ID of the job to delete
// ------------------------------------------------------------
async function deleteJob(intJobID) {
    // Confirm before deleting since this also removes all responsibilities
    const objConfirm = await Swal.fire({
        title: 'Delete Job?',
        text: 'This will also delete all responsibilities for this job.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Yes, delete it'
    });

    // If the user clicked Cancel, stop here
    if (!objConfirm.isConfirmed) return;

    try {
        const objResponse = await fetch(`${strJobsApiUrl}/${intJobID}`, {
            method: 'DELETE'
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
            return;
        }

        // Reload the list to reflect the deletion
        loadJobs();

    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not delete job.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// addResponsibility(intJobID)
// Reads the responsibility input for a specific job card and
// POSTs it to the API. Reloads only that job's responsibilities.
// @param {number} intJobID - the job to add the responsibility to
// ------------------------------------------------------------
async function addResponsibility(intJobID) {
    // Each job card has its own input field identified by job ID
    const strDescription = document.querySelector(`#txtResp_${intJobID}`).value.trim();

    if (strDescription === '') {
        Swal.fire({ title: 'Missing Field', text: 'Responsibility description is required.', icon: 'warning' });
        return;
    }

    try {
        const objResponse = await fetch(strRespApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ intJobID, strDescription })
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
            return;
        }

        // Clear just this job's input field
        document.querySelector(`#txtResp_${intJobID}`).value = '';

        // Reload only this job's responsibilities, not the whole list
        loadResponsibilities(intJobID);

    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not add responsibility.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// deleteResponsibility(intRespID, intJobID)
// DELETEs a single responsibility and reloads that job's list.
// @param {number} intRespID  - the responsibility to delete
// @param {number} intJobID   - the parent job (to reload its list)
// ------------------------------------------------------------
async function deleteResponsibility(intRespID, intJobID) {
    try {
        const objResponse = await fetch(`${strRespApiUrl}/${intRespID}`, {
            method: 'DELETE'
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
            return;
        }

        // Reload only this job's responsibility list
        loadResponsibilities(intJobID);

    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not delete responsibility.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// Wire up the Add Job button once the DOM is ready
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnAddJob').addEventListener('click', addJob);
});
