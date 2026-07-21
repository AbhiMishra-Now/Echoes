"use client";
import { motion } from "framer-motion";
import type { Chapter, Message } from "../../types/biography";
export function ChapterProgress({ chapters, messages, currentId }: { chapters: Chapter[]; messages: Message[]; currentId: string }) { const complete = chapters.filter(c => messages.filter(m => m.chapterId === c.id).length >= 5).length; const percent = Math.round((complete / Math.max(chapters.length, 8)) * 100); const number = chapters.findIndex(c => c.id === currentId) + 1; return <div className="chapter-progress"><span><b>Chapter {number} of 8</b><em>{percent}%</em></span><div><motion.i initial={false} animate={{ width: `${percent}%` }} transition={{ duration: .3 }} /></div></div>; }
