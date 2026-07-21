"use client";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useBiographyStore } from "../../store/biographyStore";
import type { Toast as ToastType } from "../../types/biography";
const icons = { success: CheckCircle2, error: AlertTriangle, info: Sparkles };
export function Toast({ toast }: { toast: ToastType }) { const dismiss = useBiographyStore(s => s.dismissToast); const [paused, setPaused] = useState(false); useEffect(() => { if (paused) return; const timer = setTimeout(() => dismiss(toast.id), toast.duration); return () => clearTimeout(timer); }, [dismiss, paused, toast.duration, toast.id]); const Icon = icons[toast.variant]; return <AnimatePresence><motion.article className={`toast ${toast.variant}`} initial={{ opacity: 0, x: 70 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 70 }} drag="x" dragConstraints={{ left: 0, right: 0 }} onDragEnd={(_, info) => { if (Math.abs(info.offset.x) > 55) dismiss(toast.id); }} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}><Icon/><div><strong>{toast.title}</strong>{toast.message && <p>{toast.message}</p>}</div><button onClick={() => dismiss(toast.id)} aria-label="Dismiss notification"><X size={15}/></button>{!paused && <i className="toast-progress" style={{ animationDuration: `${toast.duration}ms` }}/>}</motion.article></AnimatePresence>; }
