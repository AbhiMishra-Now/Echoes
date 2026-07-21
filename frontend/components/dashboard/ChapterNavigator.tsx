"use client";
import { Check, Lock, Plus } from "lucide-react";
import type { Chapter } from "../../types/biography";
export function ChapterNavigator({ chapters, currentId, onSwitch, onNew }: { chapters: Chapter[]; currentId: string; onSwitch: (id: string) => void; onNew: () => void }) { return <section className="chapter-nav"><h2>Your Journey</h2>{chapters.map((chapter, index) => <button className={`chapter-item ${chapter.id === currentId ? "active" : ""}`} key={chapter.id} onClick={() => onSwitch(chapter.id)}><span>{index + 1}</span><b>{chapter.title}</b>{index < chapters.length - 1 ? <Check size={15}/> : chapter.id === currentId ? <i /> : <Lock size={14}/>}</button>)}<button className="add-chapter" onClick={onNew}><Plus size={16}/> Add New Chapter</button></section>; }
