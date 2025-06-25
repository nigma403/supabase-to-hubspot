export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Only POST allowed' });
  }

  const lead = req.body.new;
  if (!lead) {
    return res.status(400).json({ message: 'Missing lead data' });
  }

  const { fullName, Email, phoneNumber, Zip_code } = lead;

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
          email: Email,
          firstname: firstName,
          lastname: lastName,
          phone: phoneNumber,
          zip_code: Zip_code,
          lifecyclestage: 'salesqualifiedlead',
          hubspot_owner_id: '79871537'
        }
      })
    });

    const data = await hubspotRes.json();

    if (!hubspotRes.ok) {
      throw new Error(JSON.stringify(data));
    }

    res.status(200).json({ message: 'Lead sent to HubSpot', data });
  } catch (err) {
    console.error('HubSpot error:', err.message);
    res.status(500).json({ message: 'Failed to send lead to HubSpot', error: err.message });
  }
}
