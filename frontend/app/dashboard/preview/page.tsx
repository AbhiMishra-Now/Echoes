"use client";
import Link from "next/link";
import { Download, ArrowLeft, Volume2 } from "lucide-react";
import { ScrollViewer } from "../../../components/dashboard/ScrollViewer";
import { useBiographyStore } from "../../../store/biographyStore";
export default function PreviewPage() { const chapters = useBiographyStore(s => s.chapters); return <main className="immersive-preview"><div className="dust" /><header><Link href="/dashboard" className="back"><ArrowLeft size={17}/> Back to Editor</Link><div className="preview-controls"><button aria-label="Toggle ambient sound"><Volume2 size={18}/></button><button className="mini-gold"><Download size={15}/> Export</button></div></header><section><p className="eyebrow">THE LIVING ARCHIVE</p><h1>Echoes of a Life</h1><ScrollViewer chapters={chapters} immersive /></section></main>; }
