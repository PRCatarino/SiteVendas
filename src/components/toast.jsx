"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ContextoToast = createContext(null);

export function ProvedorToast({ children }) {
  const [mensagem, setMensagem] = useState("");

  const exibirToast = useCallback((novaMensagem) => {
    setMensagem(novaMensagem);
    window.clearTimeout(window.__catarinoToastTimer);
    window.__catarinoToastTimer = window.setTimeout(() => setMensagem(""), 2600);
  }, []);

  const valor = useMemo(() => ({ exibirToast }), [exibirToast]);

  return (
    <ContextoToast.Provider value={valor}>
      {children}
      <div className={`toast ${mensagem ? "is-visible" : ""}`} role="status" aria-live="polite">
        {mensagem}
      </div>
    </ContextoToast.Provider>
  );
}

export function useToast() {
  const contexto = useContext(ContextoToast);
  if (!contexto) return { exibirToast: () => {} };
  return contexto;
}
