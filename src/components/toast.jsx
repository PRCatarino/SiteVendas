"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [message, setMessage] = useState("");

  const showToast = useCallback((nextMessage) => {
    setMessage(nextMessage);
    window.clearTimeout(window.__catarinoToastTimer);
    window.__catarinoToastTimer = window.setTimeout(() => setMessage(""), 2600);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className={`toast ${message ? "is-visible" : ""}`} role="status" aria-live="polite">
        {message}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) return { showToast: () => {} };
  return context;
}
