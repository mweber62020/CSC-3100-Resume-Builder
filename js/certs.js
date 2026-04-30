// ============================================================
// certs.js - Frontend logic for the Certifications section
// Handles adding, displaying, and deleting certifications.
// ============================================================

// API endpoint for certifications
const strCertsApiUrl = '/api/certs';

// ------------------------------------------------------------
// loadCerts()
// Fetches all certifications from the API and renders them.
// ------------------------------------------------------------
async function loadCerts() {
    try {
        const objResponse = await fetch(strCertsApiUrl);
        const arrCerts = await objResponse.json();
        renderCerts(arrCerts);
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not load certifications.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// renderCerts(arrCerts)
// Builds the certifications list in the DOM.
// Accepts an array of cert objects from the API.
// ------------------------------------------------------------
function renderCerts(arrCerts) {
    const divCertList = document.querySelector('#divCertList');

    if (arrCerts.length === 0) {
        divCertList.innerHTML = '<p class="text-muted">No certifications added yet.</p>';
        return;
    }

    divCertList.innerHTML = arrCerts.map((objCert) => `
        <div class="d-flex justify-content-between align-items-center border-bottom py-2"
            aria-label="Certification: ${objCert.strName}">
            <div>
                <strong>${objCert.strName}</strong>
                <span class="text-muted ms-2 small">
                    ${objCert.strIssuer ? objCert.strIssuer : ''}
                    ${objCert.strDate ? '&bull; ' + objCert.strDate : ''}
                </span>
            </div>
            <button class="btn btn-sm btn-outline-danger ms-2"
                aria-label="Delete certification ${objCert.strName}"
                onclick="deleteCert(${objCert.intCertID})">
                &times;
            </button>
        </div>
    `).join('');
}

// ------------------------------------------------------------
// addCert()
// Reads the form, validates, and POSTs a new certification.
// ------------------------------------------------------------
async function addCert() {
    const strName   = document.querySelector('#txtCertName').value.trim();
    const strIssuer = document.querySelector('#txtCertIssuer').value.trim();
    const strDate   = document.querySelector('#txtCertDate').value.trim();

    if (strName === '') {
        Swal.fire({ title: 'Missing Field', text: 'Certification name is required.', icon: 'warning' });
        return;
    }

    try {
        // Send the new certification to the API
        const objResponse = await fetch(strCertsApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strName, strIssuer, strDate })
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
            return;
        }
        // Clear the form and reload the certifications list
        document.querySelector('#frmAddCert').reset();
        loadCerts();
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not add certification.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// deleteCert(intCertID)
// DELETEs a certification and reloads the list.
// ------------------------------------------------------------
async function deleteCert(intCertID) {
    try {
        const objResponse = await fetch(`${strCertsApiUrl}/${intCertID}`, {
            method: 'DELETE'
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
            return;
        }

        loadCerts();
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not delete certification.', icon: 'error' });
    }
}

// Onload, set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnAddCert').addEventListener('click', addCert);
});
