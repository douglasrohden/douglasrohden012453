import { Toast, ToastToggle } from "flowbite-react";
import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { HiCheck, HiX, HiExclamation } from "react-icons/hi";

type ToastType = "success" | "error" | "warning";

interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    addToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = useCallback((message: string, type: ToastType) => {
        const id = Date.now();
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            {toasts.length > 0 && (
                <div className="fixed inset-0 bg-gray-900/50 dark:bg-black/80 z-[9990] transition-opacity duration-300 pointer-events-none" />
            )}
            <div className="fixed bottom-5 left-5 z-[9999] flex flex-col-reverse gap-3">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className="transition-all duration-300 ease-in-out transform translate-x-0 opacity-100"
                        style={{ animation: 'slideIn 0.4s ease-out forwards' }}
                    >
                        <Toast className="shadow-2xl dark:bg-gray-800 border-l-4 border-transparent overflow-hidden"
                            style={{
                                borderLeftColor:
                                    toast.type === 'success' ? '#10B981' :
                                        toast.type === 'error' ? '#EF4444' :
                                            '#F59E0B'
                            }}
                        >
                            <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toast.type === 'success' ? 'bg-green-100 text-green-500 dark:bg-green-900 dark:text-green-200' :
                                toast.type === 'error' ? 'bg-red-100 text-red-500 dark:bg-red-900 dark:text-red-200' :
                                    'bg-orange-100 text-orange-500 dark:bg-orange-900 dark:text-orange-200'
                                }`}>
                                {toast.type === 'success' && <HiCheck className="h-5 w-5" />}
                                {toast.type === 'error' && <HiX className="h-5 w-5" />}
                                {toast.type === 'warning' && <HiExclamation className="h-5 w-5" />}
                            </div>
                            <div className="ml-3 text-sm font-medium text-gray-900 dark:text-gray-100">{toast.message}</div>
                            <ToastToggle onDismiss={() => removeToast(toast.id)} className="ml-auto" />
                        </Toast>
                    </div>
                ))}
            </div>
            <style>{`
                @keyframes slideIn {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error("useToast must be used within a ToastProvider");
    }
    return context;
};
