import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const ITENS = [
  { to: '/oracao',         icon: 'ph-hands-praying',    label: 'Oração',         color: '#c084fc', bg: 'rgba(192,132,252,0.15)' },
  { to: '/financeiro',     icon: 'ph-hand-heart',       label: 'Contribuir',     color: '#facc15', bg: 'rgba(250,204,21,0.15)'  },
  { to: '/evangelismo',    icon: 'ph-megaphone',        label: 'Evangelismo',    color: '#fb923c', bg: 'rgba(251,146,60,0.15)'  },
  { to: '/teologia',       icon: 'ph-graduation-cap',   label: 'Teologia',       color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' },
  { to: '/ministerios',    icon: 'ph-users-three',      label: 'Ministérios',    color: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
  { to: '/devocional',     icon: 'ph-sun-horizon',      label: 'Devocional',     color: '#f97316', bg: 'rgba(249,115,22,0.15)'  },
  { to: '/biblia',         icon: 'ph-book-bookmark',    label: 'Bíblia',         color: '#60a5fa', bg: 'rgba(96,165,250,0.15)'  },
  { to: '/voluntarios',    icon: 'ph-heart',            label: 'Voluntários',    color: '#f472b6', bg: 'rgba(244,114,182,0.15)' },
  { to: '/aconselhamento', icon: 'ph-chat-circle-dots', label: 'Aconselhamento', color: '#4ade80', bg: 'rgba(74,222,128,0.15)'  },
  { to: '/admin',          icon: 'ph-shield-check',     label: 'Painel Admin',   color: '#a3a3a3', bg: 'rgba(163,163,163,0.15)', apenasAdmin: true },
];

// Curva de easing do próprio UISheetPresentationController da Apple — dá a
// sensação "nativa" de mola sem overshoot ao abrir/fechar o sheet.
const APPLE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
const SWIPE_DISMISS_THRESHOLD = 90;
const OPEN_ANIM_MS = 400;
const CLOSE_ANIM_MS = 260;

export default function QuickAccessSheet({ onClose }) {
  const admin = sessionStorage.getItem('adminAuth') === 'true';
  const itens = ITENS.filter(item => !item.apenasAdmin || admin);

  // 'entering' (fora da tela, no frame de montagem) → 'open' (após o 1º
  // rAF, dispara a transição de subida) → 'closing' (dispara a de descida).
  const [phase, setPhase] = useState('entering');
  const [dragY, setDragY] = useState(0);
  const dragging = useRef(false);
  const startY = useRef(0);

  // Enquanto a animação de entrada dos ícones (qasTilePop) está segurando o
  // transform com fill-mode "both", o :active de toque não consegue competir
  // com ela — então soltamos a animação assim que ela termina, liberando o
  // transform pro CSS normal (:active) cuidar do resto.
  const [tilesEntered, setTilesEntered] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const raf = requestAnimationFrame(() => setPhase('open'));
    const tilesTimer = setTimeout(() => setTilesEntered(true), 750);
    return () => {
      document.body.style.overflow = '';
      cancelAnimationFrame(raf);
      clearTimeout(tilesTimer);
    };
  }, []);

  const requestClose = () => {
    if (phase === 'closing') return;
    setPhase('closing');
    setTimeout(onClose, CLOSE_ANIM_MS);
  };

  const handleTouchStart = (e) => {
    if (phase !== 'open') return;
    dragging.current = true;
    startY.current = e.touches[0].clientY;
  };
  const handleTouchMove = (e) => {
    if (!dragging.current) return;
    const delta = e.touches[0].clientY - startY.current;
    if (delta > 0) setDragY(delta);
  };
  const handleTouchEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (dragY > SWIPE_DISMISS_THRESHOLD) {
      onClose();
    } else {
      setDragY(0);
    }
  };

  const offScreen = phase !== 'open';
  const sheetDuration = phase === 'closing' ? CLOSE_ANIM_MS : OPEN_ANIM_MS;

  return (
    <div
      onClick={requestClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 400,
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(2px)', WebkitBackdropFilter: 'blur(2px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        opacity: phase === 'open' ? 1 : 0,
        transition: `opacity ${sheetDuration}ms ease`,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          width: '100%', maxWidth: '600px',
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--glass-border)', borderBottom: 'none',
          borderRadius: '28px 28px 0 0',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
          paddingBottom: 'calc(var(--spacing-md) + env(safe-area-inset-bottom))',
          transform: `translateY(calc(${offScreen ? '100%' : '0%'} + ${dragY}px))`,
          transition: dragging.current ? 'none' : `transform ${sheetDuration}ms ${APPLE_EASE}`,
        }}
      >
        <div style={{ width: '36px', height: '5px', borderRadius: 'var(--radius-full)', background: 'var(--border-color)', margin: '10px auto 4px' }} />

        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, textAlign: 'center', margin: '4px 0 14px', color: 'var(--text-primary)' }}>
          Menu
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', padding: '0 14px' }}>
          {itens.map((item, i) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onClose}
              className="qas-tile"
              style={{
                textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: '8px', padding: '14px 6px', borderRadius: 'var(--radius-md)',
                animation: (phase === 'open' && !tilesEntered) ? `qasTilePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${i * 0.035}s both` : 'none',
              }}
            >
              <div style={{ width: '52px', height: '52px', borderRadius: 'var(--radius-full)', background: item.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={`ph ${item.icon}`} style={{ fontSize: '1.35rem', color: item.color }}></i>
              </div>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.2 }}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes qasTilePop {
          0%   { opacity: 0; transform: scale(0.55) translateY(14px); }
          60%  { opacity: 1; transform: scale(1.05) translateY(-2px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .qas-tile:active {
          transform: scale(0.92);
          background: var(--bg-surface-elevated);
        }
      `}</style>
    </div>
  );
}
