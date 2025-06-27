export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  let body;
  try {
    body = await parseJsonBody(req);
  } catch (err) {
    console.error('Failed to parse body:', err.message);
    return res.status(400).json({ message: 'Invalid JSON body' });
  }

  const lead = body.new;
  if (!lead) {
    return res.status(400).json({ message: 'Missing lead data' });
  }

  const { fullName, Email, phoneNumber, Zip_code, state, city } = lead;

  const [firstName, ...rest] = (fullName || '').split(' ');
  const lastName = rest.join(' ') || 'Unknown';

  try {
    const hubspotRes = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUBSPOT_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        properties: {
          firstname: firstName,
          lastname: lastName,
          email: Email,
          phone: phoneNumber,
          address: '',
          city: city,
          state: state,
          zip: Zip_code,
          lifecyclestage: 'salesqualifiedlead',
          hubspot_owner_id: '79871537',
          lead_source: 'Neu'
        }
      })
    });

    const data = await hubspotRes.json();

    if (!hubspotRes.ok) {
      console.error('HubSpot error:', data);
      throw new Error(JSON.stringify(data));
    }

    res.status(200).json({ message: 'Lead sent to HubSpot', data });
  } catch (err) {
    console.error('Failed to send lead:', err.message);
    res.status(500).json({ message: 'Failed to send lead to HubSpot', error: err.message });
  }
}

// Helper function to parse the body
async function parseJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  return JSON.parse(raw);
}
