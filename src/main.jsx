import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './App.css'
import { syncFromSupabase, retryCadastrosPendentes } from './data/supabase'
import { loadConfig, applyBranding } from './data/config'
import { limparAvisosExpirados } from './data/avisos'
import { limparPedidosOracaoIntercedidos } from './data/oracao'

applyBranding(loadConfig()); // pinta o splash com o cache local imediatamente
syncFromSupabase().then(() => {
  limparAvisosExpirados();
  limparPedidosOracaoIntercedidos(); // apaga de vez os pedidos já intercedidos na última quinta
  applyBranding(loadConfig());
  retryCadastrosPendentes(); // reenvia cadastro que ficou preso sem confirmar no servidor
});

// Captura o prompt de instalação nativo do Android/Chrome
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window._installPrompt = e;
});

function hideSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;
  // Aguarda animações de entrada terminarem (mínimo 1.2s), depois some
  const elapsed = Date.now() - (window._splashStart || Date.now());
  const delay = Math.max(0, 3000 - elapsed);
  setTimeout(() => {
    splash.classList.add('hide');
    setTimeout(() => splash.remove(), 650);
  }, delay);
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Remove splash após React montar e animações concluírem
hideSplash();
