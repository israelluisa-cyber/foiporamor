import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

const PULL_THRESHOLD = 70;
const MAX_PULL = 110;
const RESISTANCE = 0.5;
// Só assume que é um pull-to-refresh (e trava o gesto com preventDefault)
// depois desse tanto de arrasto — sem isso, o primeiro pixel de qualquer
// toque no topo da página já cancelava o scroll nativo inteiro.
const DEAD_ZONE = 10;

export default function PullToRefresh({ children }) {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(null);
  const distanceRef = useRef(0);
  const refreshingRef = useRef(false);
  const pullingRef = useRef(false);

  useEffect(() => { refreshingRef.current = refreshing; }, [refreshing]);

  useEffect(() => {
    if (!isHome) return undefined;

    const setPull = (value) => {
      distanceRef.current = value;
      setDistance(value);
    };

    const onTouchStart = (e) => {
      pullingRef.current = false;
      if (refreshingRef.current || window.scrollY > 0) {
        startY.current = null;
        return;
      }
      startY.current = e.touches[0].clientY;
    };

    const onTouchMove = (e) => {
      if (startY.current === null || refreshingRef.current) return;

      // A rolagem nativa já pode ter assumido o gesto (ex.: a página tinha
      // conteúdo acima e já rolou um pouco) — desiste de vez, sem tocar em
      // preventDefault, pra não cancelar o resto do toque.
      if (window.scrollY > 0) {
        startY.current = null;
        if (pullingRef.current) { pullingRef.current = false; setPull(0); }
        return;
      }

      const delta = e.touches[0].clientY - startY.current;
      if (delta <= 0) {
        if (pullingRef.current) { pullingRef.current = false; setPull(0); }
        return;
      }

      if (!pullingRef.current) {
        // Ainda dentro da zona morta: deixa o navegador tratar normalmente.
        if (delta < DEAD_ZONE) return;
        pullingRef.current = true;
      }

      e.preventDefault();
      setPull(Math.min((delta - DEAD_ZONE) * RESISTANCE, MAX_PULL));
    };

    const onTouchEnd = () => {
      startY.current = null;
      pullingRef.current = false;
      if (distanceRef.current >= PULL_THRESHOLD) {
        setPull(PULL_THRESHOLD);
        setRefreshing(true);
        window.setTimeout(() => window.location.reload(), 350);
      } else {
        setPull(0);
      }
    };

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('touchend', onTouchEnd);
    };
  }, [isHome]);

  useEffect(() => {
    if (!isHome) {
      distanceRef.current = 0;
      setDistance(0);
      setRefreshing(false);
    }
  }, [isHome]);

  const progress = Math.min(distance / PULL_THRESHOLD, 1);
  const visible = distance > 0 || refreshing;
  const offset = (refreshing ? PULL_THRESHOLD : distance) - 50;

  return (
    <>
      <div
        className={`ptr-indicator${refreshing ? ' ptr-refreshing' : ''}`}
        style={{ transform: `translateX(-50%) translateY(${offset}px)`, opacity: visible ? 1 : 0 }}
      >
        <i
          className="ph ph-arrow-clockwise"
          style={refreshing ? undefined : { transform: `rotate(${progress * 360}deg)` }}
        ></i>
      </div>
      {children}
    </>
  );
}
