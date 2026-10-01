"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider");
  return ctx;
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const resolveRef = useRef<(value: boolean) => void>(() => {});

  const confirm = useCallback<ConfirmFn>((opts) => {
    setOptions(opts);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  function close(result: boolean) {
    resolveRef.current(result);
    setOptions(null);
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {options && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
          onClick={() => close(false)}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl2 border border-slate-200 bg-white p-5 shadow-pop"
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  options.danger ? "bg-red-50 text-red-500" : "bg-teal-50 text-teal-600"
                }`}
              >
                <AlertTriangle size={17} />
              </span>
              <div>
                <h3 className="font-semibold text-ink">{options.title}</h3>
                {options.description && (
                  <p className="mt-1 text-sm text-slate-500">{options.description}</p>
                )}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                autoFocus
                onClick={() => close(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                {options.cancelLabel || "Cancel"}
              </button>
              <button
                onClick={() => close(true)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium text-white ${
                  options.danger ? "bg-red-500 hover:bg-red-600" : "bg-ink hover:bg-slate-700"
                }`}
              >
                {options.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
