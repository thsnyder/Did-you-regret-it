// const airtableBaseId = 'appMq2KDA1JTJLW2f';
// const airtableTableName = 'MainTable';


let allRecords = [];

// Fetch decisions from JSON file and populate the select element
async function loadDecisions() {
    try {
        const response = await fetch('decisions.json');
        if (!response.ok) {
            throw new Error('Failed to fetch decisions JSON file');
        }
        const decisions = await response.json();
        const decisionSelect = document.getElementById('decisionInput');

        Object.keys(decisions).forEach(group => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = group;
            decisions[group].forEach(decision => {
                const option = document.createElement('option');
                option.value = decision;
                option.textContent = decision;
                optgroup.appendChild(option);
            });
            decisionSelect.appendChild(optgroup);
        });

        // Initialize Select2 for the decision dropdown
        $(decisionSelect).select2({
            placeholder: "Select a Decision",
            allowClear: true
        });
    } catch (error) {
        console.error('Error loading decisions:', error);
    }
}

	

// Fetch data from Airtable and display cards
// Fetch data from your serverless function
async function fetchData() {
    try {
        const response = await fetch('/api/records');
        if (!response.ok) {
            console.error('Failed to fetch data from server:', response.statusText);
            return;
        }
        const data = await response.json();
        allRecords = data.records;
        console.log('Data fetched from server:', data);
        displayCards(allRecords);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Submit data through your serverless function
async function submitData(event) {
    event.preventDefault();

    const email = document.getElementById('userInput').value;
    const decision = document.getElementById('decisionInput').value;
    const reasoning = document.getElementById('reasoningInput').value;
    const regret = document.getElementById('regretInput').value;

    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    const newRecord = {
        fields: {
            User: email,
            Decision: decision,
            Reasoning: reasoning,
            Regret: regret
        }
    };

    try {
        const response = await fetch('/api/records', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(newRecord)
        });

        if (!response.ok) {
            console.error('Failed to write data to server:', response.statusText);
            return;
        }

        const data = await response.json();
        console.log('Data written to server:', data);
        fetchData();
    } catch (error) {
        console.error('Error writing data:', error);
    }

    document.getElementById('entryForm').reset();
}

document.getElementById('entryForm').addEventListener('submit', submitData);

// Sorting functions
function sortPopular(records) {
    return records.sort((a, b) => (b.fields.Yes + b.fields.No) - (a.fields.Yes + a.fields.No));
}

function sortRecent(records) {
    return records.sort((a, b) => new Date(b.CreatedAt) - new Date(a.CreatedAt));
}

function sortMostRegretted(records) {
    return records.sort((a, b) => b.fields.Yes - a.fields.Yes);
}

// Display cards with decision counts
function displayCards(records) {
    const cardsContainer = document.getElementById('cards');
    cardsContainer.innerHTML = '';

    const decisions = {};

    records.forEach(record => {
        const decision = record.fields.Decision;
        const regret = record.fields.Regret;

        if (!decisions[decision]) {
            decisions[decision] = { yes: 0, no: 0, records: [] };
        }

        decisions[decision].records.push(record);

        if (regret === 'Yes') {
            decisions[decision].yes += 1;
        } else if (regret === 'No') {
            decisions[decision].no += 1;
        }
    });

    Object.keys(decisions).forEach(decision => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow p-6 outline-cool cursor-pointer';
        card.innerHTML = `
            <h2 class="text-xl font-semibold mb-2">${decision}</h2>
            <div class="flex justify-between">
                <p class="mb-4">Regretted it: </p>
                <p class="mb-4">Yes: ${decisions[decision].yes}</p>
                <p class="mb-4">No: ${decisions[decision].no}</p>
            </div>
        `;
        card.addEventListener('click', () => showModal(decision, decisions[decision].records));
        cardsContainer.appendChild(card);
    });
}

// Show modal with detailed records
function showModal(decision, records) {
    const modal = document.getElementById('myModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalContent = document.getElementById('modalContent');

    modalTitle.textContent = decision;
    modalContent.innerHTML = '';

    records.forEach(record => {
        const recordDiv = document.createElement('div');
        recordDiv.className = 'record';
        recordDiv.innerHTML = `
            <p><strong>Reasoning:</strong> ${record.fields.Reasoning}</p>
            <p><strong>Regretted it?:</strong> ${record.fields.Regret}</p>
        `;
        modalContent.appendChild(recordDiv);

        const divider = document.createElement('div');
        divider.className = 'record-divider';
        modalContent.appendChild(divider);
    });

    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    const modal = document.getElementById('myModal');
    modal.style.display = 'none';
}

// Submit data to Airtable
async function submitData(event) {
    event.preventDefault();

    const email = document.getElementById('userInput').value;
    const decision = document.getElementById('decisionInput').value;
    const reasoning = document.getElementById('reasoningInput').value;
    const regret = document.getElementById('regretInput').value;

    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return;
    }

    const newRecord = {
        fields: {
            User: email,
            Decision: decision,
            Reasoning: reasoning,
            Regret: regret
        }
    };

    try {
        const response = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${airtablePersonalAccessToken}`
            },
            body: JSON.stringify(newRecord)
        });

        if (!response.ok) {
            console.error('Failed to write data to Airtable:', response.statusText);
            return;
        }

        const data = await response.json();
        console.log('Data written to Airtable:', data);
        fetchData();
    } catch (error) {
        console.error('Error writing data:', error);
    }

    document.getElementById('entryForm').reset();
}

// Search records
function searchRecords(event) {
    const query = event.target.value.toLowerCase();
    const filteredRecords = allRecords.filter(record => {
        return (
            record.fields.User.toLowerCase().includes(query) ||
            record.fields.Decision.toLowerCase().includes(query) ||
            record.fields.Reasoning.toLowerCase().includes(query) ||
            record.fields.Regret.toLowerCase().includes(query)
        );
    });
    displayCards(filteredRecords);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadDecisions().then(fetchData);
});

document.getElementById('entryForm').addEventListener('submit', submitData);
document.getElementById('searchInput').addEventListener('input', searchRecords);

// Sorting event listeners
document.getElementById('sortPopular').addEventListener('click', () => {
    const sortedRecords = sortPopular(allRecords);
    displayCards(sortedRecords);
});

document.getElementById('sortRecent').addEventListener('click', () => {
    const sortedRecords = sortRecent(allRecords);
    displayCards(sortedRecords);
});

document.getElementById('sortMostRegretted').addEventListener('click', () => {
    const sortedRecords = sortMostRegretted(allRecords);
    displayCards(sortedRecords);
});

// Get the <span> element that closes the modal
const span = document.getElementsByClassName('close')[0];
span.onclick = closeModal;

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    const modal = document.getElementById('myModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};
