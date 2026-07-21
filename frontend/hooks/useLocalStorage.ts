"use client";
import { useState } from "react";
export function useLocalStorage<T>(key: string, initialValue: T) { const [stored, setStored] = useState<T>(() => { if (typeof window === "undefined") return initialValue; const item = localStorage.getItem(key); try { return item ? JSON.parse(item) as T : initialValue; } catch { return initialValue; } }); const setValue = (value: T) => { setStored(value); localStorage.setItem(key, JSON.stringify(value)); }; return [stored, setValue] as const; }
