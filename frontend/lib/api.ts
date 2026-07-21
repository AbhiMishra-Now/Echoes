import axios, { AxiosError } from "axios";
import type { Chapter } from "../types/biography";

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1";
export const api = axios.create({ baseURL, timeout: 30_000, headers: { "Content-Type": "application/json" } });
api.interceptors.response.use(response => response, (error: AxiosError) => { console.error("Echoes API request failed", { status: error.response?.status, url: error.config?.url }); return Promise.reject(new Error("The magic connection flickered. Please try again.")); });

export type ApiBiography = { id: string; user_id: string; title: string; is_public: boolean; created_at: string; updated_at: string };
export type ApiChapter = { id: string; biography_id: string; user_id: string; title: string; description: string; time_period?: string; cover_image?: string; order: number; created_at: string; updated_at: string; narrative_text?: string; themes?: string[]; layout?: any[] };
export type PresignedUpload = { upload_url: string; file_key: string; file_url: string };

export async function createBiography(userId: string, title: string): Promise<ApiBiography> { return (await api.post<ApiBiography>("/biographies", { user_id: userId, title })).data; }
export async function getChapters(bioId: string, userId: string): Promise<ApiChapter[]> { return (await api.get<ApiChapter[]>(`/biographies/${encodeURIComponent(bioId)}/chapters`, { params: { user_id: userId } })).data; }
export async function createChapter(bioId: string, userId: string, title: string): Promise<ApiChapter> { return (await api.post<ApiChapter>(`/biographies/${encodeURIComponent(bioId)}/chapters`, { title, description: "Beginnings, family, and the memories that made you.", order: 1 }, { params: { user_id: userId } })).data; }
export async function updateChapter(bioId: string, chapterId: string, userId: string, payload: Partial<ApiChapter>): Promise<ApiChapter> { return (await api.patch<ApiChapter>(`/biographies/${encodeURIComponent(bioId)}/chapters/${encodeURIComponent(chapterId)}`, payload, { params: { user_id: userId } })).data; }
export async function getPresignedUrl(filename: string, contentType: string, chapterId: string): Promise<PresignedUpload> { return (await api.post<PresignedUpload>("/upload/presigned-url", { filename, content_type: contentType, chapter_id: chapterId })).data; }
export function toChapter(apiChapter: ApiChapter): Chapter { return { id: apiChapter.id, title: apiChapter.title, description: apiChapter.description, timePeriod: apiChapter.time_period, coverImage: apiChapter.cover_image, order: apiChapter.order, createdAt: new Date(apiChapter.created_at), updatedAt: new Date(apiChapter.updated_at), layout: apiChapter.layout }; }

export async function structureChapter(bioId: string, chapterId: string, userId: string): Promise<any> {
  return (await api.post(`/biographies/${encodeURIComponent(bioId)}/chapters/${encodeURIComponent(chapterId)}/structure`, null, { params: { user_id: userId } })).data;
}

export async function deleteChapter(bioId: string, chapterId: string, userId: string): Promise<void> {
  await api.delete(`/biographies/${encodeURIComponent(bioId)}/chapters/${encodeURIComponent(chapterId)}`, { params: { user_id: userId } });
}

export async function deleteMessage(bioId: string, chapterId: string, messageId: string, userId: string): Promise<void> {
  await api.delete(`/biographies/${encodeURIComponent(bioId)}/chapters/${encodeURIComponent(chapterId)}/messages/${encodeURIComponent(messageId)}`, { params: { user_id: userId } });
}
