import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertTriangle, Info, AlertCircle } from 'lucide-react'

const ToastContext = createContext({})

export const useToast = () => useContext(ToastContext)

const ICONS = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
}

const COLORS = {
    success: 'bg-eco-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-amber-500 text-white',
    info: 'bg-blue-500 text-white',
}

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random()
        setToasts(prev => [...prev, { id, message, type }])
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id))
        }, duration)
    }, [])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const toast = {
        success: (msg) => addToast(msg, 'success'),
        error: (msg) => addToast(msg, 'error'),
        warning: (msg) => addToast(msg, 'warning'),
        info: (msg) => addToast(msg, 'info'),
    }

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 max-w-sm">
                {toasts.map(t => {
                    const Icon = ICONS[t.type]
                    return (
                        <div
                            key={t.id}
                            className={`toast-enter flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${COLORS[t.type]}`}
                        >
                            <Icon size={18} />
                            <p className="flex-1 text-sm font-medium">{t.message}</p>
                            <button onClick={() => removeToast(t.id)} className="opacity-70 hover:opacity-100">
                                <X size={16} />
                            </button>
                        </div>
                    )
                })}
            </div>
        </ToastContext.Provider>
    )
}
