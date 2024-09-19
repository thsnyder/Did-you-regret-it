// const airtableBaseId = 'appMq2KDA1JTJLW2f';
// const airtableTableName = 'MainTable';


let allRecords = [];
let currentSortFunction = null;

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

        // Apply current sort function if any
        let recordsToDisplay = allRecords;
        if (currentSortFunction) {
            recordsToDisplay = currentSortFunction(allRecords);
        }

        displayCards(recordsToDisplay);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Load decisions from decisions.json and populate the select element
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
    } catch (error) {
        console.error('Error loading decisions:', error);
    }
}

// Handle form submission
async function submitData(event) {
    event.preventDefault();

    const name = document.getElementById('userInput').value.trim();
    const decision = document.getElementById('decisionInput').value;
    const reasoning = document.getElementById('reasoningInput').value.trim();
    const regret = document.getElementById('regretInput').value;

    if (!name || !decision || !reasoning || !regret) {
        alert('Please fill out all fields.');
        return;
    }

    const newRecord = {
        fields: {
            User: name,
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
            console.error('Failed to submit data to server:', response.statusText);
            alert('There was an error submitting your data. Please try again later.');
            return;
        }

        const data = await response.json();
        console.log('Data submitted to server:', data);
        alert('Your decision has been submitted successfully!');

        // Clear the form
        document.getElementById('entryForm').reset();

        // Refresh data
        fetchData();
    } catch (error) {
        console.error('Error submitting data:', error);
        alert('There was an error submitting your data. Please try again later.');
    }
}

// Display cards with decision counts
function displayCards(records) {
    const cardsContainer = document.getElementById('cards');
    cardsContainer.innerHTML = '';

    const decisions = {};

    records.forEach(record => {
        const decision = record.fields.Decision;
        const regret = record.fields.Regret;
        const createdAt = record.createdTime;

        if (!decisions[decision]) {
            decisions[decision] = { yes: 0, no: 0, records: [], createdAt };
        }

        decisions[decision].records.push(record);

        if (regret === 'Yes') {
            decisions[decision].yes += 1;
        } else if (regret === 'No') {
            decisions[decision].no += 1;
        }
    });

    // Convert decisions object to an array for sorting
    let decisionsArray = Object.keys(decisions).map(decision => {
        return {
            decision,
            yes: decisions[decision].yes,
            no: decisions[decision].no,
            records: decisions[decision].records,
            createdAt: decisions[decision].createdAt
        };
    });

    // Apply current sort function if any
    if (currentSortFunction) {
        decisionsArray = currentSortFunction(decisionsArray);
    }

    decisionsArray.forEach(item => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow p-6 outline-cool cursor-pointer';
        card.innerHTML = `
            <h2 class="text-xl font-semibold mb-2">${item.decision}</h2>
            <div class="flex justify-between">
                <p class="mb-4">Yes: ${item.yes}</p>
                <p class="mb-4">No: ${item.no}</p>
            </div>
        `;
        card.addEventListener('click', () => showModal(item.decision, item.records));
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

// Search records
function searchRecords(event) {
    const query = event.target.value.toLowerCase();
    let filteredRecords = allRecords.filter(record => {
        return (
            (record.fields.Decision && record.fields.Decision.toLowerCase().includes(query)) ||
            (record.fields.Reasoning && record.fields.Reasoning.toLowerCase().includes(query))
        );
    });

    // Apply current sort function if any
    if (currentSortFunction) {
        filteredRecords = currentSortFunction(filteredRecords);
    }

    displayCards(filteredRecords);
}

// Sorting functions
function sortPopular(decisionsArray) {
    return decisionsArray.sort((a, b) => (b.yes + b.no) - (a.yes + a.no));
}

function sortRecent(decisionsArray) {
    return decisionsArray.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function sortMostRegretted(decisionsArray) {
    return decisionsArray.sort((a, b) => b.yes - a.yes);
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    loadDecisions().then(fetchData);
});

document.getElementById('entryForm').addEventListener('submit', submitData);
document.getElementById('searchInput').addEventListener('input', searchRecords);

// Modal close button
const closeButton = document.querySelector('.modal .close');
closeButton.addEventListener('click', closeModal);

// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
    const modal = document.getElementById('myModal');
    if (event.target === modal) {
        closeModal();
    }
});

// Sorting event listeners
document.getElementById('sortPopular').addEventListener('click', () => {
    currentSortFunction = sortPopular;
    fetchData();
});

document.getElementById('sortRecent').addEventListener('click', () => {
    currentSortFunction = sortRecent;
    fetchData();
});

document.getElementById('sortMostRegretted').addEventListener('click', () => {
    currentSortFunction = sortMostRegretted;
    fetchData();
});

