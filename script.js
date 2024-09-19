// const airtableBaseId = 'appMq2KDA1JTJLW2f';
// const airtableTableName = 'MainTable';


let allRecords = [];

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

// Search records
function searchRecords(event) {
    const query = event.target.value.toLowerCase();
    const filteredRecords = allRecords.filter(record => {
        return (
            (record.fields.Decision && record.fields.Decision.toLowerCase().includes(query)) ||
            (record.fields.Reasoning && record.fields.Reasoning.toLowerCase().includes(query))
        );
    });
    displayCards(filteredRecords);
}

// Event listeners
document.addEventListener('DOMContentLoaded', fetchData);

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
