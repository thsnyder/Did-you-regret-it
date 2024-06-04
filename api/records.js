// api/records.js

const fetch = require('node-fetch');

const airtablePersonalAccessToken = process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN;
const airtableBaseId = 'appMq2KDA1JTJLW2f';
const airtableTableName = 'MainTable';

export default async (req, res) => {
    if (req.method === 'GET') {
        // Fetch data from Airtable
        try {
            const response = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`, {
                headers: {
                    Authorization: `Bearer ${airtablePersonalAccessToken}`
                }
            });
            if (!response.ok) {
                throw new Error('Failed to fetch data from Airtable');
            }
            const data = await response.json();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else if (req.method === 'POST') {
        // Handle data submission to Airtable
        const newRecord = {
            fields: req.body
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
                throw new Error('Failed to write data to Airtable');
            }
            const data = await response.json();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
};
