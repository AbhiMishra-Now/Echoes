"use client";
import { AnimatePresence, motion } from "framer-motion";
export function AIThinkingIndicator({ isVisible }: { isVisible: boolean }) { return <AnimatePresence>{isVisible && <motion.div className="ai-thinking" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} role="status"><span className="thinking-particle p1">✦</span><span className="thinking-particle p2">✧</span><span className="thinking-particle p3">✦</span><div className="quill-writing"><i>✒</i><b /></div><em>Crafting your narrative...</em></motion.div>}</AnimatePresence>; }
