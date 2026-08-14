import { useEffect } from 'react';

// Trava o scroll da página por trás enquanto um modal/sheet está aberto —
// sem isso, gestos de arraste/scroll dentro do modal (ou o teclado abrindo
// num input) também rolam a página por baixo.
// `active` é pra componentes de modal que ficam sempre montados e controlam
// a visibilidade por prop (em vez de serem montados/desmontados pelo pai).
export default function useLockBodyScroll(active = true) {
  useEffect(() => {
    if (!active) return;
    // overflow:hidden sozinho não segura scroll por wheel/toque em todo
    // navegador — a trava que realmente funciona em todo lugar (inclusive
    // o bounce do iOS) é tirar o body do fluxo com position:fixed, sem
    // nada pra rolar. Guardamos a posição do scroll pra restaurar ao sair.
    const scrollY = window.scrollY;
    const html = document.documentElement;
    const body = document.body;
    html.style.overflow = 'hidden';
    body.style.overflow = 'hidden';
    body.style.position = 'fixed';
    body.style.top = `-${scrollY}px`;
    body.style.left = '0';
    body.style.right = '0';
    return () => {
      html.style.overflow = '';
      body.style.overflow = '';
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      window.scrollTo(0, scrollY);
    };
  }, [active]);
}

