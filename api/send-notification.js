// Vercel Function (Node.js) — a REST API Key do OneSignal precisa ficar só
// aqui no servidor; se fosse pro bundle do cliente (VITE_...), qualquer um
// no navegador poderia lê-la e mandar push pra todo mundo.
export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { titulo, texto } = request.body || {};
  if (!titulo?.trim() || !texto?.trim()) {
    response.status(400).json({ error: 'titulo e texto são obrigatórios' });
    return;
  }

  const appId = process.env.VITE_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!appId || !apiKey) {
    response.status(500).json({ error: 'OneSignal não configurado no servidor' });
    return;
  }

  const r = await fetch('https://api.onesignal.com/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Key ${apiKey}`,
    },
    body: JSON.stringify({
      app_id: appId,
      target_channel: 'push',
      included_segments: ['Subscribed Users'],
      headings: { en: titulo },
      contents: { en: texto },
    }),
  });

  const data = await r.json();
  // Log temporário pra descobrir o formato real da resposta da OneSignal
  // (o toast do Admin espera um campo "recipients" que está vindo undefined).
  console.log('[send-notification] resposta da OneSignal:', JSON.stringify(data));
  response.status(r.ok ? 200 : r.status).json(data);
}
