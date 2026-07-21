"use client";
import { motion } from "framer-motion";
export function PreviewSkeleton({ isVisible }: { isVisible: boolean }) { if (!isVisible) return null; return <motion.div className="preview-skeleton parchment-texture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><i className="sk-title"/><b className="sk-divider">✦</b>{["100%", "85%", "95%", "70%"].map(width => <i key={width} className="sk-line" style={{ width }}/>)}</motion.div>; }
