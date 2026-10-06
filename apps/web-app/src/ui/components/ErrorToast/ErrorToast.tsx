import React, { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import styles from './ErrorToast.module.css';

interface ErrorToastProps {
  message: string;
  duration?: number;
  onClose: () => void;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({ message, duration = 5000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!message) return null;

  return (
    <div className={`${styles.toastContainer} ${isVisible ? styles.visible : styles.hidden}`}>
      <div className={styles.toastContent}>
        <AlertCircle className={styles.icon} size={20} />
        <span className={styles.message}>{message}</span>
        <button onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }} className={styles.closeBtn}>
          <X size={16} />
        </button>
      </div>
      <div className={styles.progressBar} style={{ animationDuration: `${duration}ms` }} />
    </div>
  );
};
