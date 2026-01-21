
import { Toast } from "flowbite-react";
import { HiCheck, HiExclamation, HiX } from "react-icons/hi";
import { useToast } from "../../contexts/ToastContext";

export function ToastContainer() {
    const { toasts, removeToast } = useToast();

    if (toasts.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <Toast key={toast.id}>
                    <div className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${toast.type === "success" ? "bg-green-100 text-green-500 dark:bg-green-800 dark:text-green-200" :
                            toast.type === "error" ? "bg-red-100 text-red-500 dark:bg-red-800 dark:text-red-200" :
                                "bg-orange-100 text-orange-500 dark:bg-orange-700 dark:text-orange-200"
                        }`}>
                        {toast.type === "success" && <HiCheck className="h-5 w-5" />}
                        {toast.type === "error" && <HiX className="h-5 w-5" />}
                        {toast.type === "warning" && <HiExclamation className="h-5 w-5" />}
                    </div>
                    <div className="ml-3 text-sm font-normal">{toast.message}</div>
                    <Toast.Toggle onDismiss={() => removeToast(toast.id)} />
                </Toast>
            ))}
        </div>
    );
}
