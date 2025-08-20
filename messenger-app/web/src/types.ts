export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content?: string | null;
    created_at: string;
    edited_at?: string | null;
    deleted_at?: string | null;
  }
