"use client";
import { useEffect, useRef } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContainerProps {
  toasts: Toast[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(toast.id), 3500);
    return () => clearTimeout(timerRef.current);
  }, [toast.id, onRemove]);

  const icon = toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ";
  return (
    <div className={`toast toast-${toast.type}`} onClick={() => onRemove(toast.id)} style={{ cursor: "pointer" }}>
      <span style={{ fontSize: 16, fontWeight: 700 }}>{icon}</span>
      <span>{toast.message}</span>
    </div>
  );
}
