"use client";
import { useEffect } from "react";
import { useBiographyStore } from "../store/biographyStore";
export function useBiography() { const store = useBiographyStore(); useEffect(() => { const save = () => localStorage.setItem("echoes-last-save", new Date().toISOString()); const timer = setInterval(save, 30000); addEventListener("beforeunload", save); return () => { clearInterval(timer); removeEventListener("beforeunload", save); }; }, []); return store; }
