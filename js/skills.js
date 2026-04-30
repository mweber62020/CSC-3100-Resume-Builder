// ============================================================
// skills.js - Frontend logic for the Skills section
// Handles adding, displaying, and deleting skills.
// ============================================================

// API endpoint for skills
const strSkillsApiUrl = '/api/skills';

// ------------------------------------------------------------
// loadSkills()
// Fetches all skills from the API and renders them.
// ------------------------------------------------------------
async function loadSkills() {
    try {
        const objResponse = await fetch(strSkillsApiUrl);
        const arrSkills = await objResponse.json();
        renderSkills(arrSkills);
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not load skills.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// renderSkills(arrSkills)
// Builds the skills list in the DOM.
// Skills are grouped by category if one is provided.
// ------------------------------------------------------------
function renderSkills(arrSkills) {
    const divSkillList = document.querySelector('#divSkillList');

    if (arrSkills.length === 0) {
        divSkillList.innerHTML = '<p class="text-muted">No skills added yet.</p>';
        return;
    }

    // Group skills by category so they display together.
    const objGrouped = {};
    arrSkills.forEach((objSkill) => {
        const strCategory = objSkill.strCategory || 'Other';
        if (!objGrouped[strCategory]) {
            objGrouped[strCategory] = [];
        }
        objGrouped[strCategory].push(objSkill);
    });

    // Build one card per category group
    divSkillList.innerHTML = Object.keys(objGrouped).map((strCategory) => `
        <div class="card mb-3" aria-label="Skill category: ${strCategory}">
            <div class="card-header">${strCategory}</div>
            <div class="card-body">
                ${objGrouped[strCategory].map((objSkill) => `
                    <div class="d-flex justify-content-between align-items-center border-bottom py-1"
                        aria-label="Skill: ${objSkill.strName}">
                        <span>${objSkill.strName}</span>
                        <button class="btn btn-sm btn-outline-danger ms-2"
                            aria-label="Delete skill ${objSkill.strName}"
                            onclick="deleteSkill(${objSkill.intSkillID})">
                            &times;
                        </button>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
}

// ------------------------------------------------------------
// addSkill()
// Reads the form, validates, and POSTs a new skill.
// ------------------------------------------------------------
async function addSkill() {
    const strName     = document.querySelector('#txtSkillName').value.trim();
    const strCategory = document.querySelector('#txtSkillCategory').value.trim();

    // Clear any previous validation and check fields
    document.querySelector('#txtSkillName').classList.remove('is-invalid');
    if (strName === '') {
        document.querySelector('#txtSkillName').classList.add('is-invalid');
        return;
    }

    try {
        // Send the new skill to the API
        const objResponse = await fetch(strSkillsApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ strName, strCategory })
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
            return;
        }

        document.querySelector('#frmAddSkill').reset();
        document.querySelector('#txtSkillName').classList.remove('is-invalid');
        loadSkills();
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not add skill.', icon: 'error' });
    }
}

// ------------------------------------------------------------
// deleteSkill(intSkillID)
// DELETEs a skill and reloads the list.
// ------------------------------------------------------------
async function deleteSkill(intSkillID) {
    try {
        const objResponse = await fetch(`${strSkillsApiUrl}/${intSkillID}`, {
            method: 'DELETE'
        });

        const objData = await objResponse.json();

        if (!objResponse.ok) {
            Swal.fire({ title: 'Error', text: objData.strError, icon: 'error' });
            return;
        }

        loadSkills();
    } catch (objError) {
        Swal.fire({ title: 'Error', text: 'Could not delete skill.', icon: 'error' });
    }
}

// Onload, set up event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.querySelector('#btnAddSkill').addEventListener('click', addSkill);
});
