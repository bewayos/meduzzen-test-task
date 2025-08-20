export type User = {
  id: string;
  username: string;
  email: string;
  created_at: string;
};

export type Attachment = {
  id: string;
  filename: string;
  storage_key: string;
  mime: string;
  size_bytes: number;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender: User;
  content: string | null;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
  attachments: Attachment[];
};
