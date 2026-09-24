"use client";

import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { CheckCircle2, LoaderCircle, AlertCircle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = "info") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Auto-remove after 5 seconds if not a loading toast
    if (type !== "loading") {
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    }
    return id;
  }, [removeToast]);

  const updateToast = useCallback((id, message, type) => {
    setToasts((prev) => prev.map(t => t.id === id ? { ...t, message, type } : t));
    if (type !== "loading") {
      setTimeout(() => {
        removeToast(id);
      }, 5000);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ addToast, removeToast, updateToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id} 
            className="animate-rise pointer-events-auto flex items-center gap-3 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border-color)] p-4 shadow-xl min-w-[280px]"
          >
            {toast.type === "loading" && <LoaderCircle size={18} className="animate-spin text-[var(--accent-mint)]" />}
            {toast.type === "success" && <CheckCircle2 size={18} className="text-[var(--accent-mint)]" />}
            {toast.type === "error" && <AlertCircle size={18} className="text-[var(--accent-coral)]" />}
            {toast.type === "info" && <Info size={18} className="text-[var(--text-muted)]" />}
            
            <p className="text-sm font-bold text-[var(--text-main)] flex-1">{toast.message}</p>
            
            {toast.type !== "loading" && (
              <button onClick={() => removeToast(toast.id)} className="text-[var(--text-muted)] hover:text-[var(--accent-coral)] transition">
                <X size={16} />
              </button>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
