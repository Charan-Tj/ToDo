"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
  id: string;
  msg: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (msg: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = (msg: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className={`p-4 rounded-[12px] border shadow-[0_10px_30px_rgba(16,34,58,0.22)] text-white pointer-events-auto min-w-[250px] backdrop-blur-md
                ${t.type === 'error' ? 'bg-[#c0352b]/95 border-[#dd7d74]' : t.type === 'success' ? 'bg-[#1e8a5a]/95 border-[#6ebf99]' : 'bg-[#1f6f66]/95 border-[#6aa79f]'}
              `}
            >
              <div className="text-sm font-medium">{t.msg}</div>
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: 3, ease: 'linear' }}
                className="h-1 bg-white/30 mt-2 rounded-full"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx.toast;
};
