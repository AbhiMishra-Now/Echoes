"use client";
import type { Chapter } from "../../types/biography";
import { GoldenDivider } from "../ui/GoldenDivider";
import { useBiographyStore } from "../../store/biographyStore";
export function ScrollViewer({ chapters, immersive = false }: { chapters: Chapter[]; immersive?: boolean }) { const messages = useBiographyStore(s => s.messages); return <div className={`scroll-viewer parchment-texture ${immersive ? "large-scroll" : ""}`}>{chapters.map(chapter => { const prose = messages.filter(m => m.chapterId === chapter.id && m.sender === "user"); return <article key={chapter.id}><span>{chapter.timePeriod}</span><h2>{chapter.title}</h2><GoldenDivider/>{prose.length ? prose.map(m => <p key={m.id}>{m.content}</p>) : <p className="ghost-copy">Your memories will begin to appear here, lovingly illuminated in ink.</p>}</article>; })}</div>; }
