// api/records.js

const fetch = require('node-fetch');

const airtableApiKey = process.env.AIRTABLE_API_KEY;
const airtableBaseId = process.env.AIRTABLE_BASE_ID;
const airtableTableName = process.env.AIRTABLE_TABLE_NAME;

module.exports = async (req, res) => {
    if (req.method === 'GET') {
        try {
            const response = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`, {
                headers: {
                    Authorization: `Bearer ${airtableApiKey}`
                }
            });

            if (!response.ok) {
                return res.status(response.status).json({ error: response.statusText });
            }

            const data = await response.json();
            res.status(200).json(data);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else if (req.method === 'POST') {
        const { fields } = req.body;

        try {
            const response = await fetch(`https://api.airtable.com/v0/${airtableBaseId}/${airtableTableName}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${airtableApiKey}`
                },
                body: JSON.stringify({ fields })
            });

            if (!response.ok) {
                return res.status(response.status).json({ error: response.statusText });
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
