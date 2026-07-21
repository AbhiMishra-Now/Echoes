"use client";
import { Toast } from "./Toast";
import { useBiographyStore } from "../../store/biographyStore";
export function ToastContainer() { const toasts = useBiographyStore(s => s.toasts); return <div className="toast-container" aria-live="polite">{toasts.map(toast => <Toast key={toast.id} toast={toast}/>)}</div>; }
