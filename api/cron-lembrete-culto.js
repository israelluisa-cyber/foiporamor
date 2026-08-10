// Vercel Function (Node.js) chamada pelo GitHub Actions a cada 15min (ver
// .github/workflows/culto-lembrete.yml) — confere se algum culto ativo
// começa em ~30min e, se sim, dispara um push avisando. Autenticada por
// CRON_SECRET pra ninguém de fora conseguir chamar isso e mandar push à toa.
import { createClient } from '@supabase/supabase-js';

// Janela aberta (não só os 15min ideais entre dois ticks do cron): o
// GitHub Actions agenda "schedule" como best-effort e pode atrasar ou pular
// uma rodada, então aceitamos qualquer tick entre o culto e 30min antes —
// se um tick falhar, o próximo ainda cai dentro da janela. A tabela
// culto_lembretes_enviados evita duplicar caso mais de uma rodada acerte
// a janela do mesmo culto no mesmo dia.
const ANTECEDENCIA_MIN = 30;

export default async function handler(request, response) {
  if (request.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    response.status(401).json({ error: 'unauthorized' });
    return;
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  const appId = process.env.VITE_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;
  if (!supabaseUrl || !supabaseKey || !appId || !apiKey) {
    response.status(500).json({ error: 'Variáveis de ambiente faltando no servidor' });
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: configRow, error: configError } = await supabase
    .from('app_config').select('data').eq('id', 'main').single();
  if (configError || !configRow) {
    response.status(500).json({ error: 'Não deu pra carregar app_config', detail: configError?.message });
    return;
  }
  const cultos = configRow.data?.cultos || [];

  // Horário local de Brasília calculado via Intl (sem lib de datas) — o
  // servidor da Vercel roda em UTC, e os horários dos cultos em config.js
  // são sempre no horário de Brasília.
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Sao_Paulo',
    weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const parte = (tipo) => partes.find(p => p.type === tipo)?.value;
  const DIAS_SEMANA = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const diaSemanaHoje = DIAS_SEMANA[parte('weekday')];
  const minutosAgora = Number(parte('hour')) * 60 + Number(parte('minute'));
  const dataHojeISO = `${parte('year')}-${parte('month')}-${parte('day')}`;

  const enviados = [];
  for (const culto of cultos) {
    if (culto.ativo === false) continue;
    if (culto.diaSemana !== diaSemanaHoje) continue;
    const faltam = (culto.hora * 60 + culto.min) - minutosAgora;
    if (faltam <= 0 || faltam > ANTECEDENCIA_MIN) continue;

    // Marca "já enviado hoje" antes de mandar o push — se a linha já existir
    // (violação de PK), outra rodada já cuidou desse culto, então pula.
    const { error: dedupError } = await supabase
      .from('culto_lembretes_enviados')
      .insert({ culto_id: String(culto.id), data: dataHojeISO });
    if (dedupError) {
      if (dedupError.code !== '23505') console.error('[cron-lembrete-culto] erro no dedup:', dedupError.message);
      continue;
    }

    const hhmm = `${String(culto.hora).padStart(2, '0')}:${String(culto.min).padStart(2, '0')}`;
    const r = await fetch('https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Key ${apiKey}` },
      body: JSON.stringify({
        app_id: appId,
        target_channel: 'push',
        included_segments: ['Total Subscriptions'],
        headings: { en: 'Igreja Foi Por Amor' },
        contents: { en: `${culto.nome} começa às ${hhmm}. Não perca!` },
      }),
    });
    const data = await r.json();
    enviados.push({ culto: culto.nome, status: r.status, data });
  }

  response.status(200).json({ ok: true, diaSemanaHoje, minutosAgora, enviados });
}
