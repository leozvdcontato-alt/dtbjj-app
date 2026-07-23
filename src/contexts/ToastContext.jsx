import {
  createContext,
  useContext,
  useRef,
  useState,
} from "react";

import Toast from "@/components/ui/Toast";

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toast, setToast] = useState({
    mensagem: "",
    tipo: "success",
    visivel: false,
  });

  const timeoutRef = useRef(null);

  function mostrarToast(mensagem, tipo = "success") {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToast({
      mensagem,
      tipo,
      visivel: true,
    });

    timeoutRef.current = setTimeout(() => {
      setToast((prev) => ({
        ...prev,
        visivel: false,
      }));

      timeoutRef.current = null;
    }, 3000);
  }

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}

      <Toast
        visivel={toast.visivel}
        mensagem={toast.mensagem}
        tipo={toast.tipo}
      />
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}