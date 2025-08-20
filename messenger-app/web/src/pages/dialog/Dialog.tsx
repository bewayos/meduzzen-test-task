import { useParams } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { useRef, useState, useMemo } from "react";
import { getMessages, sendMessage, updateMessage, deleteMessage } from "../../api/messages";
import type { Message } from "../../api/messages";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConversationWS } from "../../hooks/useConversationWS";
import { listConversations } from "../../api/conversations";
import type { Conversation } from "../../api/conversations";

export default function Dialog() {
  const { id = "" } = useParams();
  const token = useAuth((s) => s.token);
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["messages", id],
    queryFn: () => getMessages(id),
    enabled: !!id,
  });

  const userId = useMemo(() => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1])).sub as string;
    } catch {
      return null;
    }
  }, [token]);

  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [editing, setEditing] = useState<Message | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const { data: convs } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
  });

  useConversationWS(id, token, (evt) => {
    if (evt?.type === "message:new") {
      qc.invalidateQueries({ queryKey: ["messages", id] });
    } else if (evt?.type === "message:update") {
      qc.setQueryData(["messages", id], (old: Message[] | undefined) =>
        (old || []).map((m) =>
          m.id === evt.id ? { ...m, content: evt.content, edited_at: evt.edited_at } : m
        )
      );
    } else if (evt?.type === "message:delete") {
      qc.setQueryData(["messages", id], (old: Message[] | undefined) =>
        (old || []).map((m) => (m.id === evt.id ? { ...m, deleted_at: evt.deleted_at } : m))
      );
    }
  });

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (editing) {
      if (!text.trim() || !token) return;
      const updated = await updateMessage(editing.id, text, token);
      qc.setQueryData(["messages", id], (old: Message[] | undefined) =>
        (old || []).map((m) => (m.id === updated.id ? updated : m))
      );
      setEditing(null);
    } else {
      if (!text && files.length === 0) return;
      await sendMessage(id, { content: text || undefined, files });
      refetch();
    }
    setText("");
    setFiles([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onDelete(mid: string) {
    if (!token) return;
    const deleted = await deleteMessage(mid, token);
    qc.setQueryData(["messages", id], (old: Message[] | undefined) =>
      (old || []).map((m) => (m.id === deleted.id ? deleted : m))
    );
  }

  const peerUsername = useMemo(() => {
    if (data && userId) {
      const otherMsg = (data || []).find((m) => m.sender_id !== userId);
      if (otherMsg?.sender?.username) return otherMsg.sender.username;
    }
    const conv = (convs as Conversation[] | undefined)?.find((c) => c.id === id);
    if (conv && userId) {
      const peer = conv.user_a?.id === userId ? conv.user_b : conv.user_a;
      return peer?.username || null;
    }
    return null;
  }, [data, convs, id, userId]);

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Dialog with {peerUsername}</h1>

      <div className="flex-1 min-h-[300px] border rounded p-3 overflow-auto bg-gray-50 dark:bg-gray-900">
        {isLoading && <div>Loading…</div>}
        {error && <div className="text-red-500 text-sm">Failed to load.</div>}
        <ul className="space-y-2">
          {(data || []).slice().reverse().map((m: Message) => (
            <li key={m.id} className="bg-white dark:bg-black/20 rounded p-2">
              <div className="text-xs text-gray-500">
                from {m.sender?.username || m.sender_id.slice(0, 8) + "…"} at {new Date(m.created_at).toLocaleString()}
                {m.edited_at && !m.deleted_at && <span className="ml-1 italic">edited</span>}
              </div>
              {m.deleted_at ? (
                <div className="italic text-gray-400">Message deleted</div>
              ) : (
                <div className="whitespace-pre-wrap">
                  {m.content || <span className="italic text-gray-400">[attachments only]</span>}
                </div>
              )}
              {!m.deleted_at && m.sender_id === userId && (
                <div className="flex gap-2 text-xs mt-1">
                  <button
                    className="text-blue-600"
                    onClick={() => {
                      setEditing(m);
                      setText(m.content || "");
                    }}
                  >
                    Edit
                  </button>
                  <button className="text-red-600" onClick={() => onDelete(m.id)}>
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <form onSubmit={onSend} className="flex flex-col gap-2">
        <textarea
          className="border rounded p-2"
          placeholder="Type a message…"
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <input
            ref={fileRef}
            type="file"
            multiple
            onChange={(e) => setFiles(Array.from(e.target.files || []))}
            disabled={!!editing}
          />
          <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">
            {editing ? "Save" : "Send"}
          </button>
          {editing && (
            <button
              type="button"
              className="px-4 py-2 bg-gray-300 rounded"
              onClick={() => {
                setEditing(null);
                setText("");
              }}
            >
              Cancel
            </button>
          )}
        </div>
        {files.length > 0 && !editing && (
          <div className="text-xs text-gray-500">{files.length} file(s) selected</div>
        )}
      </form>
    </div>
  );
}
