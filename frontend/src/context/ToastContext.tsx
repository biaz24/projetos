import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { createPortal } from "react-dom";
import "./Toast.css";

export type ToastType = "success" | "error" | "info";

interface Toast {
  id: number;
  type: ToastType;
  message: string;
  saindo: boolean;
}

interface ToastContextData {
  showToast: (message: string, type?: ToastType) => void;
}

const DURACAO_MS = 4000;
const SAIDA_MS = 220;

const ICONES: Record<ToastType, string> = {
  success: "fa-circle-check",
  error: "fa-circle-xmark",
  info: "fa-circle-info",
};

const ToastContext = createContext<ToastContextData>({} as ToastContextData);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const proximoId = useRef(1);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const lista = timers.current;
    return () => lista.forEach((t) => window.clearTimeout(t));
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, saindo: true } : t)));

    timers.current.push(
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, SAIDA_MS),
    );
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = "success") => {
      const id = proximoId.current++;
      setToasts((prev) => [...prev.slice(-3), { id, type, message, saindo: false }]);

      timers.current.push(window.setTimeout(() => removeToast(id), DURACAO_MS));
    },
    [removeToast],
  );

  const valor = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={valor}>
      {children}

      {createPortal(
        <div className="tt-pilha" aria-live="polite" aria-atomic="false">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className="tt-aviso"
              data-tipo={toast.type}
              data-saindo={toast.saindo}
              role={toast.type === "error" ? "alert" : "status"}
            >
              <span className="tt-icone" aria-hidden="true">
                <i className={`fa-solid ${ICONES[toast.type]}`}></i>
              </span>

              <p className="tt-texto">{toast.message}</p>

              <button
                type="button"
                className="tt-fechar"
                onClick={() => removeToast(toast.id)}
                aria-label="Fechar aviso"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>

              <span className="tt-barra" aria-hidden="true"></span>
            </div>
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextData => {
  return useContext(ToastContext);
};
