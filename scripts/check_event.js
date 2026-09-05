const token = process.env.SUPABASE_ACCESS_TOKEN || '';

async function run() {
  if (!token) {
    console.log('No SUPABASE_ACCESS_TOKEN set');
    return;
  }
  const query = `
    SELECT id, full_name, email, status, ticket_id, registered_at 
    FROM public.registrations 
    WHERE event_id = '0bfe512b-ac5e-4c83-8272-3364499d309a' 
    ORDER BY registered_at ASC;
  `;

  const res = await fetch('https://api.supabase.com/v1/projects/yrvijufespplklfnvsfg/database/query', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  console.log('Total Registrations:', data.length);
  data.forEach((r, idx) => console.log(`${idx + 1}. [${r.status.toUpperCase()}] ${r.full_name} (${r.email}) - Ticket: ${r.ticket_id}`));
}

run();
