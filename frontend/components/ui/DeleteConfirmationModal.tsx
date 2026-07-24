"use client";

import React from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  title?: string;
  description?: string;
}

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting = false,
  title = "Remove Memory Permanently?",
  description = "This memory will be removed from your active chapter and saved spreads. This action cannot be undone.",
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300000] bg-black/75 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#1b0227] border-2 border-red-500/40 p-6 rounded-3xl max-w-md w-full shadow-2xl relative text-parchment animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-parchment/60 hover:text-parchment transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="text-center pt-2 pb-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/20 text-red-400 border border-red-500/30 mb-3 shadow-md">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="font-display text-xl text-parchment font-bold tracking-wide">
            {title}
          </h3>
          <p className="text-xs font-sans text-parchment/70 mt-2 leading-relaxed px-2">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-3 border-t border-gold/15">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-full border border-gold/20 bg-white/5 hover:bg-white/10 text-parchment text-xs font-bold uppercase tracking-wider transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 py-2.5 px-4 rounded-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-500 hover:to-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{isDeleting ? "Deleting..." : "Delete Memory"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
