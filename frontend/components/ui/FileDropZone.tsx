"use client";
import { BookOpen } from "lucide-react";
import { type ReactNode, useState } from "react";
export function FileDropZone({ onFiles, children }: { onFiles: (files: File[]) => void; children: ReactNode }) { const [dragging, setDragging] = useState(false); return <div className="drop-container" onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); onFiles(Array.from(e.dataTransfer.files)); }}>{children}{dragging && <div className="drop-overlay"><BookOpen size={62}/><h2>Drop Your Memories Here</h2><p>Photos, videos, voice notes, and documents</p></div>}</div>; }
