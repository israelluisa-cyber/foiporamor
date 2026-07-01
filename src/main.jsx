import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'
import './App.css'
import { syncFromSupabase } from './data/supabase'

syncFromSupabase();

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
