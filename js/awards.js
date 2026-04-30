// ============================================================
// awards.js - Frontend logic for the Awards section
// Handles adding, displaying, and deleting awards.
// ============================================================

// API endpoint for awards
const strAwardsApiUrl = '/api/awards';

// ------------------------------------------------------------
// loadAwards()
// Fetches all awards from the API and renders them.
// ------------------------------------------------------------
async function loadAwards() {
    try {
        const objResponse = await fetch(strAwardsApiUrl);
        const arrAwards = await objResponse.json();
        renderAwards(arrAwards);
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not load awards.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// renderAwards(arrAwards)
// Builds the awards list.
// Accepts an array of award objects from the API
// ------------------------------------------------------------
function renderAwards(arrAwards) {
    const divAwardList = document.querySelector('#divAwardList');

    if (arrAwards.length === 0) {
        divAwardList.innerHTML = '<p class="text-muted">No awards added yet.</p>';
        return;
    }
    // Build the HTML for each award using cards
    divAwardList.innerHTML = arrAwards.map((objAward) => `
        <div class="card mb-2" aria-label="Award: ${objAward.strName}">
            <div class="card-body d-flex justify-content-between align-items-start">
                <div>
                    <strong>${objAward.strName}</strong>
                    <span class="text-muted ms-2 small">
                        ${objAward.strIssuer ? objAward.strIssuer : ''}
                        ${objAward.strDate ? '&bull; ' + objAward.strDate : ''} <!-- bullet point -->
                    </span>
                    ${objAward.strDescription
                        ? `<p class="text-muted small mb-0 mt-1">${objAward.strDescription}</p>`
                        : ''}
                </div>
                <button class="btn btn-sm btn-outline-danger ms-3"
                    aria-label="Delete award ${objAward.strName}"
                    onclick="deleteAward(${objAward.intAwardID})">
                    &times;
                </button>
            </div>
        </div>
    `).join('');
}

// ------------------------------------------------------------
// addAward()
// Reads the form, validates, and POSTs a new award.
// ------------------------------------------------------------
async function addAward() {
    const strName = document.querySelector('#txtAwardName').value.trim();
    const strIssuer = document.querySelector('#txtAwardIssuer').value.trim();
    const strDate = document.querySelector('#txtAwardDate').value.trim();
    const strDescription = document.querySelector('#txtAwardDescription').value.trim();

    if (strName === '') {
        Swal.fire({ title: 'Missing Field', text: 'Award name is required.', icon: 'warning' });
        return;
    }

    try {
        // Send the new award to the API
        const objResponse = await fetch(strAwardsApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strName, strIssuer, strDate, strDescription })
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
            return;
        }
        // Clear the form and reload the awards list
        document.querySelector('#frmAddAward').reset();
        loadAwards();
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not add award.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// deleteAward(intAwardID)
// Deletes an award and reloads the list.
// ------------------------------------------------------------
async function deleteAward(intAwardID) {
    try {
        const objResponse = await fetch(`${strAwardsApiUrl}/${intAwardID}`, {
            method: 'DELETE'
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
            return;
        }

        loadAwards();
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not delete award.', icon: 'error' });
    }
}

// Onload, set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnAddAward').addEventListener('click', addAward);
});
