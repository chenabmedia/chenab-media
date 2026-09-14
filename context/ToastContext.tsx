'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3500) => {
      const id = Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
      const newToast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev.slice(-3), newToast]); // keep max 4 toasts

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      <div
        role="region"
        aria-label="Notifications"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-md w-[calc(100vw-2.5rem)] pointer-events-none"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto p-4 border flex items-start gap-3 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-3 fade-in ${
              toast.type === 'success'
                ? 'bg-[#0A160F]/95 border-emerald-800/80 text-emerald-300'
                : toast.type === 'error'
                ? 'bg-[#180A0A]/95 border-red-800/80 text-red-300'
                : 'bg-[#111111]/95 border-[#2E2E2E] text-[#F5F5F5]'
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {toast.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
              {toast.type === 'error' && <AlertCircle size={16} className="text-red-400" />}
              {toast.type === 'info' && <Info size={16} className="text-sky-400" />}
            </div>
            <div className="flex-1 font-mono text-xs leading-relaxed break-words">
              {toast.message}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 p-1 text-[#888888] hover:text-white transition-colors"
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
