import api from "./client";

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
}

export async function getMessages(conversationId: string, cursor?: string, limit = 50): Promise<Message[]> {
  const q = new URLSearchParams();
  if (cursor) q.set("cursor", cursor);
  q.set("limit", String(limit));
  const res = await api.get<Message[]>(`/conversations/${conversationId}/messages?${q.toString()}`);
  return res.data;
}

export async function sendMessage(conversationId: string, opts: { content?: string; files?: File[] }) {
  const form = new FormData();
  if (opts.content) form.append("content", opts.content);
  (opts.files || []).forEach((f) => form.append("files", f));
  const res = await api.post<{ id: string }>(`/conversations/${conversationId}/messages`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}
