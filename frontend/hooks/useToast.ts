"use client";
import { useBiographyStore } from "../store/biographyStore";
import type { ToastVariant } from "../types/biography";
export interface ToastOptions { title: string; message?: string; variant: ToastVariant; duration?: number; }
export function useToast() { const addToast = useBiographyStore(s => s.addToast); const dismissToast = useBiographyStore(s => s.dismissToast); return { showToast: (options: ToastOptions) => addToast({ ...options, duration: options.duration ?? 3000 }), dismissToast }; }
