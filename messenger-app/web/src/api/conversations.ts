import api from "./client";

export interface Conversation {
  id: string;
  user_a_id: string;
  user_b_id: string;
  created_at: string;
}

export async function listConversations(): Promise<Conversation[]> {
  const res = await api.get<Conversation[]>("/conversations");
  return res.data;
}

export async function createOrGetConversation(peer_id: string): Promise<Conversation> {
  const res = await api.post<Conversation>("/conversations", { peer_id });
  return res.data;
}
