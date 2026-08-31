import React, { createContext, useContext, useState, ReactNode } from "react";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastContextData {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Container de Toasts Flutuantes */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          maxWidth: "360px",
          width: "100%",
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => {
          let bg = "#10b981"; // success
          let icon = "fa-solid fa-circle-check";
          if (toast.type === "error") {
            bg = "#ef4444";
            icon = "fa-solid fa-circle-xmark";
          } else if (toast.type === "info") {
            bg = "#3b82f6";
            icon = "fa-solid fa-circle-info";
          }

          return (
            <div
              key={toast.id}
              style={{
                pointerEvents: "auto",
                background: bg,
                color: "white",
                padding: "12px 16px",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
                fontSize: "12px",
                fontWeight: "bold",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <i className={icon} style={{ fontSize: "16px" }}></i>
                <span>{toast.message}</span>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                style={{
                  background: "none",
                  border: "none",
                  color: "white",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextData => {
  return useContext(ToastContext);
};
