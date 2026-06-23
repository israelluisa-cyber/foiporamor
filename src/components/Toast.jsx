import { useEffect } from 'react';

export default function Toast({ message, icon = 'ph-info', type = 'info', onClose, duration = 3000 }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="toast-container">
      <div className={`toast ${type}`}>
        <i className={`ph ${icon}`}></i>
        <span>{message}</span>
      </div>
    </div>
  );
}
