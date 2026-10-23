'use client';

import React, { createContext, useCallback, useContext, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'error' | 'info';

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { id, message, variant }]);
      setTimeout(() => {
        dismiss(id);
      }, 4200);
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-20 right-4 z-[90] flex max-w-sm flex-col gap-2.5 md:bottom-6 md:right-6"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.variant === 'success';
          const isError = toast.variant === 'error';
          return (
            <div
              key={toast.id}
              className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-panel-elevated backdrop-blur-xl transition-all ${
                isSuccess
                  ? 'border-emerald-500/40 bg-slate-900/95 text-emerald-100'
                  : isError
                    ? 'border-rose-500/45 bg-slate-900/95 text-rose-100'
                    : 'border-cyan-400/40 bg-slate-900/95 text-slate-100'
              }`}
            >
              {isSuccess ? (
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              ) : isError ? (
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              ) : (
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
              )}
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="text-slate-400 transition hover:text-white"
                aria-label="Fechar notificação"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast deve ser utilizado dentro de um ToastProvider.');
  }
  return ctx;
}
