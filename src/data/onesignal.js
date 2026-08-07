import OneSignal from 'react-onesignal';

const APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

let initialized = false;

// Inicializa o SDK uma única vez, cedo no ciclo de vida do app (chamado em
// main.jsx). Sem APP_ID configurado (.env local sem a chave), não faz nada —
// evita erro em ambiente de quem ainda não configurou o OneSignal.
export async function initOneSignal() {
  if (initialized || !APP_ID) return;
  initialized = true;
  await OneSignal.init({ appId: APP_ID });
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
  if (!APP_ID) throw new Error('OneSignal sem APP_ID configurado neste ambiente.');
  if (typeof Notification === 'undefined') {
    throw new Error('Este navegador/contexto não suporta notificações push (no iPhone, precisa abrir pelo ícone instalado na Tela de Início).');
  }
  await OneSignal.Notifications.requestPermission();
}

// Estado atual da permissão no navegador — usado pra decidir se mostra o
// botão "Ativar notificações" ou "Notificações ativadas".
export function notificacaoPermitida() {
  return typeof Notification !== 'undefined' && Notification.permission === 'granted';
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
    return r.ok;
  } catch {
    return false;
  }
}
