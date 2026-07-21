"use client";
import type { Chapter } from "../../types/biography";
export function TimelineView({ chapters, onSelect }: { chapters: Chapter[]; onSelect: (id: string) => void }) { return <ol className="timeline-preview">{chapters.map((chapter, i) => <li key={chapter.id}><button onClick={() => onSelect(chapter.id)}><i>{i + 1}</i><span>{chapter.timePeriod || "A new chapter"}</span><b>{chapter.title}</b></button></li>)}</ol>; }
