// ============================================================
// resume.js - Frontend logic for the Resume Builder section
//
// Loads all saved data, renders a selection UI with checkboxes,
// generates a formatted resume preview, and handles printing.
//
// Functions:
//   loadResumeBuilder()   - fetches all data and renders selection UI
//   renderSelections()    - builds the checkbox UI from loaded data
//   generatePreview()     - builds the resume HTML from selections
//   printResume()         - triggers the browser print dialog
// ============================================================

// Holds all data fetched from the API so generatePreview()
// can access it without making additional requests
let objAllData = {
    objProfile:  {},
    arrJobs:     [],  // each job also gets an arrResponsibilities property
    arrSkills:   [],
    arrCerts:    [],
    arrAwards:   [],
    strFont:     'Arial'
};

// ------------------------------------------------------------
// loadResumeBuilder()
// Fetches all data from the API in parallel, then renders
// the selection UI. Called when the Build Resume nav link
// or the Awards Next button is clicked.
// ------------------------------------------------------------
async function loadResumeBuilder() {
    const divSelections = document.querySelector('#divResumeSelections');
    divSelections.innerHTML = '<p class="text-muted">Loading your data...</p>';

    try {
        // Fetch profile, jobs, skills, certs, awards, and settings all at once.
        // Promise.all() runs them in parallel so we don't wait for each one
        // sequentially - much faster than awaiting them one by one.
        const [objProfileRes, objJobsRes, objSkillsRes, objCertsRes, objAwardsRes, objSettingsRes] =
            await Promise.all([
                fetch('/api/profile'),
                fetch('/api/jobs'),
                fetch('/api/skills'),
                fetch('/api/certs'),
                fetch('/api/awards'),
                fetch('/api/settings')
            ]);

        objAllData.objProfile = await objProfileRes.json();
        objAllData.arrJobs    = await objJobsRes.json();
        objAllData.arrSkills  = await objSkillsRes.json();
        objAllData.arrCerts   = await objCertsRes.json();
        objAllData.arrAwards  = await objAwardsRes.json();

        const objSettings = await objSettingsRes.json();
        objAllData.strFont = objSettings.strResumeFont || 'Arial';

        // For each job, fetch its responsibilities and attach them
        // directly to the job object so we have everything in one place
        await Promise.all(objAllData.arrJobs.map(async (objJob) => {
            const objRespRes = await fetch(`/api/responsibilities?intJobID=${objJob.intJobID}`);
            objJob.arrResponsibilities = await objRespRes.json();
        }));

        renderSelections();

    } catch (objError) {
        divSelections.innerHTML = '<p class="text-danger">Could not load data. Is the server running?</p>';
    }
}

// ------------------------------------------------------------
// renderSelections()
// Builds the checkbox UI from the loaded data so the user
// can pick what to include in their resume.
// ------------------------------------------------------------
function renderSelections() {
    const divSelections = document.querySelector('#divResumeSelections');

    // Build each section only if there's data to show
    let strHTML = '<div class="row g-4">';

    // --- Jobs and Responsibilities ---
    strHTML += `
        <div class="col-md-6">
            <div class="card h-100" aria-label="Select jobs and responsibilities">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>Jobs &amp; Responsibilities</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary"
                        aria-label="Select all jobs"
                        onclick="toggleAll('job')">Select All</button>
                </div>
                <div class="card-body">
    `;

    if (objAllData.arrJobs.length === 0) {
        strHTML += '<p class="text-muted small">No jobs added yet.</p>';
    } else {
        objAllData.arrJobs.forEach((objJob) => {
            strHTML += `
                <div class="mb-3">
                    <!-- Job-level checkbox -->
                    <div class="form-check">
                        <input class="form-check-input job-check" type="checkbox"
                            id="chkJob_${objJob.intJobID}"
                            value="${objJob.intJobID}"
                            aria-label="Include job: ${objJob.strTitle} at ${objJob.strCompany}"
                            onchange="toggleJobResponsibilities(${objJob.intJobID}, this.checked)" />
                        <label class="form-check-label fw-bold" for="chkJob_${objJob.intJobID}">
                            ${objJob.strTitle} — ${objJob.strCompany}
                        </label>
                    </div>
                    <!-- Responsibility checkboxes nested under their job -->
                    <div class="ms-4" id="divRespChecks_${objJob.intJobID}">
                        ${objJob.arrResponsibilities.map((objResp) => `
                            <div class="form-check">
                                <input class="form-check-input resp-check" type="checkbox"
                                    id="chkResp_${objResp.intResponsibilityID}"
                                    value="${objResp.intResponsibilityID}"
                                    data-jobid="${objJob.intJobID}"
                                    aria-label="Include responsibility: ${objResp.strDescription}" />
                                <label class="form-check-label small" for="chkResp_${objResp.intResponsibilityID}">
                                    ${objResp.strDescription}
                                </label>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        });
    }

    strHTML += `</div></div></div>`;

    // --- Skills ---
    strHTML += `
        <div class="col-md-6">
            <div class="card h-100" aria-label="Select skills">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>Skills</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary"
                        aria-label="Select all skills"
                        onclick="toggleAll('skill')">Select All</button>
                </div>
                <div class="card-body">
    `;

    if (objAllData.arrSkills.length === 0) {
        strHTML += '<p class="text-muted small">No skills added yet.</p>';
    } else {
        objAllData.arrSkills.forEach((objSkill) => {
            strHTML += `
                <div class="form-check">
                    <input class="form-check-input skill-check" type="checkbox"
                        id="chkSkill_${objSkill.intSkillID}"
                        value="${objSkill.intSkillID}"
                        aria-label="Include skill: ${objSkill.strName}" />
                    <label class="form-check-label small" for="chkSkill_${objSkill.intSkillID}">
                        ${objSkill.strName}
                        ${objSkill.strCategory ? `<span class="text-muted">(${objSkill.strCategory})</span>` : ''}
                    </label>
                </div>
            `;
        });
    }

    strHTML += `</div></div></div>`;

    // --- Certifications ---
    strHTML += `
        <div class="col-md-6">
            <div class="card h-100" aria-label="Select certifications">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>Certifications</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary"
                        aria-label="Select all certifications"
                        onclick="toggleAll('cert')">Select All</button>
                </div>
                <div class="card-body">
    `;

    if (objAllData.arrCerts.length === 0) {
        strHTML += '<p class="text-muted small">No certifications added yet.</p>';
    } else {
        objAllData.arrCerts.forEach((objCert) => {
            strHTML += `
                <div class="form-check">
                    <input class="form-check-input cert-check" type="checkbox"
                        id="chkCert_${objCert.intCertID}"
                        value="${objCert.intCertID}"
                        aria-label="Include certification: ${objCert.strName}" />
                    <label class="form-check-label small" for="chkCert_${objCert.intCertID}">
                        ${objCert.strName}
                        ${objCert.strIssuer ? `— ${objCert.strIssuer}` : ''}
                        ${objCert.strDate ? `(${objCert.strDate})` : ''}
                    </label>
                </div>
            `;
        });
    }

    strHTML += `</div></div></div>`;

    // --- Awards ---
    strHTML += `
        <div class="col-md-6">
            <div class="card h-100" aria-label="Select awards">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <span>Awards</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary"
                        aria-label="Select all awards"
                        onclick="toggleAll('award')">Select All</button>
                </div>
                <div class="card-body">
    `;

    if (objAllData.arrAwards.length === 0) {
        strHTML += '<p class="text-muted small">No awards added yet.</p>';
    } else {
        objAllData.arrAwards.forEach((objAward) => {
            strHTML += `
                <div class="form-check">
                    <input class="form-check-input award-check" type="checkbox"
                        id="chkAward_${objAward.intAwardID}"
                        value="${objAward.intAwardID}"
                        aria-label="Include award: ${objAward.strName}" />
                    <label class="form-check-label small" for="chkAward_${objAward.intAwardID}">
                        ${objAward.strName}
                        ${objAward.strIssuer ? `— ${objAward.strIssuer}` : ''}
                        ${objAward.strDate ? `(${objAward.strDate})` : ''}
                    </label>
                </div>
            `;
        });
    }

    strHTML += `</div></div></div>`;

    strHTML += '</div>'; // close row

    divSelections.innerHTML = strHTML;
}

// ------------------------------------------------------------
// toggleJobResponsibilities(intJobID, blnChecked)
// When a job checkbox is checked, automatically check all its
// responsibilities. When unchecked, uncheck them all.
// @param {number}  intJobID   - the job that was toggled
// @param {boolean} blnChecked - whether it was checked or unchecked
// ------------------------------------------------------------
function toggleJobResponsibilities(intJobID, blnChecked) {
    const arrRespChecks = document.querySelectorAll(`#divRespChecks_${intJobID} .resp-check`);
    arrRespChecks.forEach((elCheck) => {
        elCheck.checked = blnChecked;
    });
}

// ------------------------------------------------------------
// toggleAll(strType)
// Selects or deselects all checkboxes in a section.
// Works as a toggle - if all are checked, unchecks all; otherwise checks all.
// @param {string} strType - 'job', 'skill', 'cert', or 'award'
// ------------------------------------------------------------
function toggleAll(strType) {
    const arrChecks = document.querySelectorAll(`.${strType}-check`);
    // If every checkbox is already checked, uncheck all - otherwise check all
    const blnAllChecked = Array.from(arrChecks).every((el) => el.checked);
    arrChecks.forEach((el) => {
        el.checked = !blnAllChecked;
        // If it's a job checkbox, also toggle its responsibilities
        if (strType === 'job') {
            const intJobID = el.value;
            toggleJobResponsibilities(intJobID, !blnAllChecked);
        }
    });
}

// ------------------------------------------------------------
// generatePreview()
// Reads all checked checkboxes, filters the data to only the
// selected items, and renders a formatted resume into
// divResumePreview. Also applies the saved font preference.
// ------------------------------------------------------------
function generatePreview() {
    // Guard: if the selection UI hasn't been loaded yet, tell the user
    if (!objAllData.objProfile.intProfileID && objAllData.arrJobs.length === 0) {
        Swal.fire({
            title: 'No Data Loaded',
            text: 'Please use the Build Resume nav link or the Next button on the Awards page to load your data first.',
            icon: 'warning'
        });
        return;
    }

    // Collect selected IDs from each section
    const arrSelectedJobIDs  = [...document.querySelectorAll('.job-check:checked')].map(el => parseInt(el.value));
    const arrSelectedRespIDs = [...document.querySelectorAll('.resp-check:checked')].map(el => parseInt(el.value));
    const arrSelectedSkillIDs = [...document.querySelectorAll('.skill-check:checked')].map(el => parseInt(el.value));
    const arrSelectedCertIDs = [...document.querySelectorAll('.cert-check:checked')].map(el => parseInt(el.value));
    const arrSelectedAwardIDs = [...document.querySelectorAll('.award-check:checked')].map(el => parseInt(el.value));

    const objProfile = objAllData.objProfile;

    // Build the resume HTML string
    // Inline styles are used here intentionally so the formatting
    // survives when printed - @media print removes all Bootstrap classes
    let strResume = `
        <div style="font-family: ${objAllData.strFont}, sans-serif; color: #222; max-width: 750px; margin: 0 auto; line-height: 1.5;">

            <!-- Header: Name and contact info -->
            <div style="text-align: center; margin-bottom: 16px;">
                <h1 style="font-size: 28px; margin: 0; font-weight: bold;">
                    ${objProfile.strFirstName || ''} ${objProfile.strLastName || ''}
                </h1>
                <p style="margin: 4px 0; font-size: 14px; color: #555;">
                    ${[objProfile.strEmail, objProfile.strPhone, objProfile.strLocation]
                        .filter(Boolean).join(' &nbsp;|&nbsp; ')}
                </p>
            </div>
            <hr style="border: 1px solid #222; margin-bottom: 16px;" />
    `;

    // --- Professional Summary ---
    if (objProfile.strSummary) {
        strResume += `
            <div style="margin-bottom: 16px;">
                <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px;
                            border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px;">
                    Professional Summary
                </h2>
                <p style="font-size: 13px; margin: 0;">${objProfile.strSummary}</p>
            </div>
        `;
    }

    // --- Work Experience ---
    // Only include jobs that were checked, and only the responsibilities that were checked
    const arrSelectedJobs = objAllData.arrJobs.filter(
        (objJob) => arrSelectedJobIDs.includes(objJob.intJobID)
    );

    if (arrSelectedJobs.length > 0) {
        strResume += `
            <div style="margin-bottom: 16px;">
                <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px;
                            border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px;">
                    Work Experience
                </h2>
        `;

        arrSelectedJobs.forEach((objJob) => {
            // Build the date/location line, skipping empty fields
            const strMeta = [
                objJob.strLocation,
                [objJob.strStartDate, objJob.strEndDate].filter(Boolean).join(' – ')
            ].filter(Boolean).join(' &nbsp;|&nbsp; ');

            strResume += `
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <strong style="font-size: 14px;">${objJob.strTitle}</strong>
                        <span style="font-size: 12px; color: #555;">${strMeta}</span>
                    </div>
                    <div style="font-size: 13px; color: #444; margin-bottom: 4px;">${objJob.strCompany}</div>
            `;

            // Filter responsibilities to only the ones the user checked
            const arrSelectedResps = objJob.arrResponsibilities.filter(
                (objResp) => arrSelectedRespIDs.includes(objResp.intResponsibilityID)
            );

            if (arrSelectedResps.length > 0) {
                strResume += `<ul style="margin: 4px 0 0 0; padding-left: 20px;">`;
                arrSelectedResps.forEach((objResp) => {
                    strResume += `<li style="font-size: 13px; margin-bottom: 2px;">${objResp.strDescription}</li>`;
                });
                strResume += `</ul>`;
            }

            strResume += `</div>`;
        });

        strResume += `</div>`;
    }

    // --- Skills ---
    const arrSelectedSkills = objAllData.arrSkills.filter(
        (objSkill) => arrSelectedSkillIDs.includes(objSkill.intSkillID)
    );

    if (arrSelectedSkills.length > 0) {
        // Group selected skills by category for a clean layout
        const objGrouped = {};
        arrSelectedSkills.forEach((objSkill) => {
            const strCat = objSkill.strCategory || 'Skills';
            if (!objGrouped[strCat]) objGrouped[strCat] = [];
            objGrouped[strCat].push(objSkill.strName);
        });

        strResume += `
            <div style="margin-bottom: 16px;">
                <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px;
                            border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px;">
                    Skills
                </h2>
        `;

        Object.keys(objGrouped).forEach((strCat) => {
            strResume += `
                <div style="font-size: 13px; margin-bottom: 4px;">
                    <strong>${strCat}:</strong> ${objGrouped[strCat].join(', ')}
                </div>
            `;
        });

        strResume += `</div>`;
    }

    // --- Certifications ---
    const arrSelectedCerts = objAllData.arrCerts.filter(
        (objCert) => arrSelectedCertIDs.includes(objCert.intCertID)
    );

    if (arrSelectedCerts.length > 0) {
        strResume += `
            <div style="margin-bottom: 16px;">
                <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px;
                            border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px;">
                    Certifications
                </h2>
        `;
        arrSelectedCerts.forEach((objCert) => {
            strResume += `
                <div style="font-size: 13px; margin-bottom: 4px;">
                    <strong>${objCert.strName}</strong>
                    ${objCert.strIssuer ? ` — ${objCert.strIssuer}` : ''}
                    ${objCert.strDate ? ` <span style="color:#555;">(${objCert.strDate})</span>` : ''}
                </div>
            `;
        });
        strResume += `</div>`;
    }

    // --- Awards ---
    const arrSelectedAwards = objAllData.arrAwards.filter(
        (objAward) => arrSelectedAwardIDs.includes(objAward.intAwardID)
    );

    if (arrSelectedAwards.length > 0) {
        strResume += `
            <div style="margin-bottom: 16px;">
                <h2 style="font-size: 14px; text-transform: uppercase; letter-spacing: 1px;
                            border-bottom: 1px solid #ccc; padding-bottom: 4px; margin-bottom: 8px;">
                    Awards
                </h2>
        `;
        arrSelectedAwards.forEach((objAward) => {
            strResume += `
                <div style="font-size: 13px; margin-bottom: 6px;">
                    <strong>${objAward.strName}</strong>
                    ${objAward.strIssuer ? ` — ${objAward.strIssuer}` : ''}
                    ${objAward.strDate ? ` <span style="color:#555;">(${objAward.strDate})</span>` : ''}
                    ${objAward.strDescription ? `<div style="color:#444; margin-top:2px;">${objAward.strDescription}</div>` : ''}
                </div>
            `;
        });
        strResume += `</div>`;
    }

    strResume += `</div>`; // close outer resume div

    // Inject the finished resume into the preview area
    document.querySelector('#divResumePreview').innerHTML = strResume;

    // Scroll the preview into view so the user sees it immediately
    document.querySelector('#divResumePreview').scrollIntoView({ behavior: 'smooth' });
}

// ------------------------------------------------------------
// printResume()
// Opens a new browser window containing only the resume HTML,
// then triggers the print dialog on that window.
//
// We use a new window instead of printing the main page because
// this is a SPA - hiding everything except the preview via CSS
// is unreliable when content is nested inside hidden parent elements.
// A new window gives us a clean page with just the resume.
// ------------------------------------------------------------
function printResume() {
    const divPreview = document.querySelector('#divResumePreview');

    if (!divPreview.innerHTML.trim()) {
        Swal.fire({
            title: 'No Preview',
            text: 'Please generate a preview before printing.',
            icon: 'warning'
        });
        return;
    }

    // Open a blank new window
    const objPrintWindow = window.open('', '_blank');

    // Write a minimal HTML page containing only the resume content
    objPrintWindow.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8" />
            <title>Resume</title>
            <style>
                @page { margin: 0.75in; }
                body { margin: 0; padding: 0; background: white; }
            </style>
        </head>
        <body>
            ${divPreview.innerHTML}
        </body>
        </html>
    `);

    // Close the document stream so the browser knows it's fully loaded
    objPrintWindow.document.close();
    objPrintWindow.focus();

    // Small delay to let the content render before the print dialog opens
    setTimeout(() => {
        objPrintWindow.print();
        objPrintWindow.close();
    }, 250);
}

// ------------------------------------------------------------
// Wire up buttons once the DOM is ready
// ------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnGenerateResume').addEventListener('click', generatePreview);
    document.querySelector('#btnPrintResume').addEventListener('click', printResume);
});
