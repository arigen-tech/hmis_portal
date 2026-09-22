import { useState, useCallback, useEffect, useRef } from 'react';

export function useToast() {
  const [toastMessage, setToastMessage] = useState(null);
  const timerRef = useRef(null);

  const showToast = useCallback((msg, type = 'success', duration = 3000) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToastMessage({ message: msg, type });
    timerRef.current = setTimeout(() => {
      setToastMessage(null);
    }, duration);
  }, []);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setToastMessage(null);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return {
    toastMessage,
    showToast,
    hideToast
  };
}
