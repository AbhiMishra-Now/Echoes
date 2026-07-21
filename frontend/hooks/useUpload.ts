"use client";
import type { MediaItem } from "../types/biography";
export async function filesToMedia(files: File[]): Promise<MediaItem[]> { return files.map(file => ({ id: crypto.randomUUID(), type: file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : file.type.startsWith("audio/") ? "audio" : "document", url: URL.createObjectURL(file), filename: file.name, size: file.size, uploadedAt: new Date() })); }
