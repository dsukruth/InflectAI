import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from "react";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  exiting: boolean;
}

const DURATIONS: Record<ToastType, number> = {
  success: 3000,
  error: 7000,
  warning: 5000,
  info: 4000,
};

const ACCENT: Record<ToastType, string> = {
  success: "#00D68F",
  error: "#E05555",
  warning: "#F0A500",
  info: "#8892A4",
};

const ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✗",
  warning: "⚠",
  info: "ℹ",
};

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

export const useInflectToast = () => useContext(ToastContext);

export const InflectToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 200);
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, type, exiting: false }]);
      setTimeout(() => removeToast(id), DURATIONS[type]);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed z-[100]" style={{ top: 72, right: 24 }}>
        <div className="flex flex-col gap-2">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="flex items-center gap-3 overflow-hidden"
              style={{
                minWidth: 280,
                maxWidth: 360,
                background: "#0F1820",
                borderRadius: 8,
                padding: "12px 16px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
                animation: toast.exiting
                  ? "toast-out 200ms ease-in forwards"
                  : "toast-in 150ms ease-out forwards",
              }}
            >
              <div
                className="self-stretch shrink-0"
                style={{ width: 4, borderRadius: 2, background: ACCENT[toast.type] }}
              />
              <span style={{ color: ACCENT[toast.type], fontSize: 16, fontWeight: 700 }}>
                {ICONS[toast.type]}
              </span>
              <span style={{ color: "#FFFFFF", fontSize: 13, flex: 1 }}>{toast.message}</span>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
};
