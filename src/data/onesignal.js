import OneSignal from 'react-onesignal';

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;
// Sem isso, o SDK ignora silenciosamente qualquer pedido de permissão em
// navegadores da família Safari (iOS inteiro, inclusive instalado na Tela de
// Início) — funciona normal no Chrome/Android mesmo sem essa chave, o que
// mascarou o problema até testarmos no iPhone. Gerado em
// dashboard.onesignal.com → Settings → Web Configuration.
const SAFARI_WEB_ID = import.meta.env.VITE_ONESIGNAL_SAFARI_WEB_ID;

let initialized = false;

// Inicializa o SDK uma única vez, cedo no ciclo de vida do app (chamado em
// main.jsx). Sem APP_ID configurado (.env local sem a chave), não faz nada —
// evita erro em ambiente de quem ainda não configurou o OneSignal.
//
// Não usamos OneSignal.init() do pacote react-onesignal: antes de carregar o
// script real, ele roda uma checagem de suporte (isPushNotificationsSupported)
// que testa `window.safari.pushNotification` — API que só existiu no Safari
// de macOS antigo, nunca no iOS. No iPhone essa checagem sempre falha,
// init() rejeita antes até de adicionar o <script> do OneSignal na página, e
// como não tinha .catch() aqui, a rejeição sumia em silêncio — o SDK nunca
// carregava e qualquer chamada depois (como pedirPermissaoNotificacao) ficava
// esperando pra sempre uma resposta que nunca vinha. Carregamos o script na
// mão (é o mesmo jeito que o próprio painel do OneSignal recomenda) e
// deixamos a checagem de suporte de verdade a cargo do script deles, que é
// quem sabe se o iOS atual suporta push.
export async function initOneSignal() {
  console.log('[onesignal] initOneSignal chamado. APP_ID:', APP_ID, 'SAFARI_WEB_ID:', SAFARI_WEB_ID);
  if (initialized || !APP_ID) {
    console.log('[onesignal] abortou init (initialized=', initialized, ' APP_ID=', APP_ID, ')');
    return;
  }
  initialized = true;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  if (!document.getElementById('onesignal-sdk')) {
    const script = document.createElement('script');
    script.id = 'onesignal-sdk';
    script.defer = true;
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.onload = () => console.log('[onesignal] script cdn.onesignal.com carregou com sucesso');
    script.onerror = (e) => console.error('[onesignal] script cdn.onesignal.com FALHOU ao carregar', e);
    document.head.appendChild(script);
  }
  console.log('[onesignal] empilhando callback de init no OneSignalDeferred');
  window.OneSignalDeferred.push((OneSignalSDK) => {
    console.log('[onesignal] callback do OneSignalDeferred executou, chamando OneSignalSDK.init()');
    OneSignalSDK.init({ appId: APP_ID, safari_web_id: SAFARI_WEB_ID })
      .then(() => {
        console.log('[onesignal] OneSignalSDK.init() resolveu com sucesso');
        // Autocura quem ativou antes do optIn() explícito existir (ver
        // pedirPermissaoNotificacao): permissão do navegador já concedida,
        // mas a inscrição podia ter ficado "not subscribed" do lado da
        // OneSignal, sem nenhum jeito de o usuário perceber ou corrigir sozinho.
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && !OneSignalSDK.User.PushSubscription.optedIn) {
          console.log('[onesignal] permissão já concedida mas optedIn=false — chamando optIn() pra autocurar');
          OneSignalSDK.User.PushSubscription.optIn().catch((err) => console.error('[onesignal] optIn() de autocura falhou:', err));
        }
      })
      .catch((err) => console.error('[onesignal] OneSignalSDK.init() rejeitou:', err));
  });
}

// Vincula o dispositivo ao membro logado, pra podermos mandar notificação
// só pra ele (ou segmentar por membro) e não perder o vínculo entre sessões.
export function loginOneSignalMembro(id) {
  if (!APP_ID || id == null) return;
  OneSignal.login(String(id));
}

// Desvincula o dispositivo do membro ao sair — sem isso, o próximo a logar
// nesse mesmo aparelho herdaria a identidade do anterior no OneSignal.
export function logoutOneSignalMembro() {
  if (!APP_ID) return;
  OneSignal.logout();
}

// Pede a permissão do navegador. Precisa ser chamado a partir de um clique
// do usuário (botão na tela) — navegador ignora/bloqueia se chamado sozinho
// ao carregar a página.
export async function pedirPermissaoNotificacao() {
  console.log('[onesignal] pedirPermissaoNotificacao chamado');
  if (!APP_ID) throw new Error('OneSignal sem APP_ID configurado neste ambiente.');
  if (typeof Notification === 'undefined') {
    throw new Error('Este navegador/contexto não suporta notificações push (no iPhone, precisa abrir pelo ícone instalado na Tela de Início).');
  }
  console.log('[onesignal] Notification existe, permission atual:', Notification.permission, '— chamando OneSignal.Notifications.requestPermission()');
  const semResposta = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('O OneSignal não respondeu a tempo. Tente novamente em alguns segundos.')), 15000);
  });
  try {
    const resultado = await Promise.race([OneSignal.Notifications.requestPermission(), semResposta]);
    console.log('[onesignal] requestPermission voltou:', resultado, 'Notification.permission agora:', Notification.permission);
  } catch (e) {
    console.error('[onesignal] requestPermission deu erro/timeout:', e);
    throw e;
  }
  // Conceder a permissão do navegador não garante, sozinho, que a OneSignal
  // marque essa inscrição como "subscribed" do lado dela — sem esse optIn()
  // explícito, o push era aceito pela API mas voltava com "All included
  // players are not subscribed" e ninguém recebia nada, mesmo com o botão
  // mostrando "Notificações ativadas" (que só reflete a permissão do navegador).
  try {
    await OneSignal.User.PushSubscription.optIn();
    console.log('[onesignal] optIn() concluído. PushSubscription:', {
      id: OneSignal.User.PushSubscription.id,
      optedIn: OneSignal.User.PushSubscription.optedIn,
    });
  } catch (e) {
    console.error('[onesignal] optIn() deu erro:', e);
    throw e;
  }
}

// Estado atual da permissão no navegador — usado pra decidir se mostra o
// botão "Ativar notificações" ou "Notificações ativadas".
export function notificacaoPermitida() {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
}

// Snapshot do estado real da inscrição na OneSignal — usado no painel de
// depuração (ver diagnosticoPushSubscription() na tela /usuario) pra
// enxergar direto na tela do celular por que o push está caindo em
// "not subscribed" mesmo com a permissão do navegador concedida.
export function diagnosticoPushSubscription() {
  try {
    return {
      // Últimos 8 caracteres do appId que o bundle do cliente usou pra
      // inicializar o SDK — comparar com o log "appId usado no servidor"
      // em api/send-notification.js pra descartar mismatch entre os dois.
      appIdCliente: APP_ID ? `...${APP_ID.slice(-8)}` : null,
      notificationPermission: typeof Notification !== 'undefined' ? Notification.permission : 'indisponível',
      subscriptionId: OneSignal?.User?.PushSubscription?.id ?? null,
      optedIn: OneSignal?.User?.PushSubscription?.optedIn ?? null,
      token: OneSignal?.User?.PushSubscription?.token ?? null,
    };
  } catch (e) {
    return { erro: e?.message || String(e) };
  }
}

// Força o optIn() de novo sob demanda (fora do fluxo normal de pedir
// permissão), pra testar no painel de depuração sem precisar revogar a
// permissão do navegador antes.
export async function forcarOptIn() {
  await OneSignal.User.PushSubscription.optIn();
  return diagnosticoPushSubscription();
}

// Pede pro backend (/api/send-notification, que guarda a REST API Key em
// segredo) disparar um push pra todo mundo com notificação ativada. Só o
// Admin chama isso, ao publicar um comunicado.
export async function enviarNotificacaoPush({ titulo, texto }) {
  try {
    const r = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ titulo, texto }),
    });
    const data = await r.json().catch(() => null);
    if (!r.ok) console.error('[onesignal] /api/send-notification falhou:', r.status, data);
    else console.log('[onesignal] /api/send-notification respondeu OK:', data);
    return { ok: r.ok, error: r.ok ? null : (data?.error || data || `HTTP ${r.status}`), data };
  } catch (e) {
    console.error('[onesignal] /api/send-notification deu exceção:', e);
    return { ok: false, error: e?.message || String(e) };
  }
}
