import { createContext, useCallback, useContext, useMemo, useState } from "react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (message, tone = "ok", options = {}) => {
      const id = crypto.randomUUID();
      setToasts((current) => [...current.slice(-2), { id, message, tone, ...options }]);
      setTimeout(() => dismiss(id), options.onAction ? 6500 : 3800);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 left-1/2 z-50 flex w-[min(92vw,26rem)] -translate-x-1/2 flex-col gap-2 sm:left-auto sm:right-6 sm:translate-x-0"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-rise pointer-events-auto flex items-center gap-3 rounded-card border px-4 py-3 text-sm shadow-lift ${
              toast.tone === "error"
                ? "border-risk/20 bg-risk-soft text-risk"
                : "border-ink/10 bg-ink text-paper"
            }`}
          >
            {toast.tone !== "error" && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-track" />}
            <span className="min-w-0 flex-1 leading-snug">{toast.message}</span>
            {toast.onAction && (
              <button
                type="button"
                className="shrink-0 rounded-full px-2.5 py-1 text-[13px] font-semibold text-[#F0B49C] transition hover:bg-paper/10"
                onClick={() => {
                  toast.onAction();
                  dismiss(toast.id);
                }}
              >
                {toast.actionLabel || "Undo"}
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
