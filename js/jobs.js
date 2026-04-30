// ============================================================
// jobs.js - Frontend logic for the Jobs section
// Handles adding, displaying, and deleting jobs and their responsibilities.
// ============================================================

// API endpoints for jobs and responsibilities
const strJobsApiUrl = '/api/jobs';
const strRespApiUrl = '/api/responsibilities';

// ------------------------------------------------------------
// loadJobs()
// Fetches all jobs from the API and renders them on the page.
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
// Accepts an array of job objects from the API.
// ------------------------------------------------------------
function renderJobs(arrJobs) {
    const divJobList = document.querySelector('#divJobList');

    // If there are no jobs yet, show a simple message
    if (arrJobs.length === 0) {
        divJobList.innerHTML = '<p class="text-muted">No jobs added yet.</p>';
        return;
    }

    // Build a card for each job
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

    // After rendering all job cards, load responsibilities
    arrJobs.forEach((objJob) => {
        loadResponsibilities(objJob.intJobID);
    });
}

// ------------------------------------------------------------
// loadResponsibilities(intJobID)
// Fetches responsibilities for one job and renders them inside that jobs card
// -------------------------------------------
async function loadResponsibilities(intJobID) {
    try {
        // Pass intJobID as a query string
        const objResponse = await fetch(`${strRespApiUrl}?intJobID=${intJobID}`);
        const arrResps = await objResponse.json();

        const divRespList = document.querySelector(`#divRespList_${intJobID}`);

        if (arrResps.length === 0) {
            divRespList.innerHTML = '<p class="text-muted small">No responsibilities added yet.</p>';
            return;
        }

        // Render each responsibility as a simple row.
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
// Reads values from the Add Job form, validates them, and POSTs a new job to the API.
// ------------------------------------------------------------
async function addJob() {
    const strCompany  = document.querySelector('#txtJobCompany').value.trim();
    const strTitle    = document.querySelector('#txtJobTitle').value.trim();
    const strStart    = document.querySelector('#txtJobStart').value.trim();
    const strEnd      = document.querySelector('#txtJobEnd').value.trim();
    const strLocation = document.querySelector('#txtJobLocation').value.trim();

    // Clear any previous validation state before re-checking
    document.querySelector('#txtJobCompany').classList.remove('is-invalid');
    document.querySelector('#txtJobTitle').classList.remove('is-invalid');

    // Show inline errors on required fields and stop if anything is missing
    let blnValid = true;
    if (strCompany === '') {
        document.querySelector('#txtJobCompany').classList.add('is-invalid');
        blnValid = false;
    }
    if (strTitle === '') {
        document.querySelector('#txtJobTitle').classList.add('is-invalid');
        blnValid = false;
    }
    if (!blnValid) return;

    try {
        const objResponse = await fetch(strJobsApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Send data as JSON in the request body
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

        // Clear any previous validation and check fields
        document.querySelector('#frmAddJob').reset();
        document.querySelector('#txtJobCompany').classList.remove('is-invalid');
        document.querySelector('#txtJobTitle').classList.remove('is-invalid');
        loadJobs();

    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not add job.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// deleteJob(intJobID)
// Asks the user to confirm, then DELETEs the job and reloads.
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

    // If the user clicked Cancel, stop
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
// Reads the responsibility input for a specific job card and POSTs it to the API. 
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

        // Clear just this job's input field and reload its responsibilities
        document.querySelector(`#txtResp_${intJobID}`).value = '';
        loadResponsibilities(intJobID);

    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not add responsibility.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// deleteResponsibility(intRespID, intJobID)
// DELETEs a single responsibility and reloads that job's list.
// intJobID is needed to reload just that job's responsibilities.
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

// Onload, set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnAddJob').addEventListener('click', addJob);
});
