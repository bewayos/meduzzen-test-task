import { useParams } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { useRef, useState } from "react";
import { getMessages, sendMessage } from "../../api/messages";
import type { Message } from "../../api/messages";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConversationWS } from "../../hooks/useConversationWS";

export default function Dialog() {
  const { id = "" } = useParams();
  const token = useAuth((s) => s.token);
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["messages", id],
    queryFn: () => getMessages(id),
    enabled: !!id,
  });

  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useConversationWS(id, token, (evt) => {
    if (evt?.type === "message:new") {
      qc.invalidateQueries({ queryKey: ["messages", id] });
    }
  });

  async function onSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text && files.length === 0) return;
    await sendMessage(id, { content: text || undefined, files });
    setText("");
    setFiles([]);
    if (fileRef.current) fileRef.current.value = "";
    refetch();
  }

  return (
    <div className="max-w-3xl mx-auto p-4 flex flex-col gap-3">
      <h1 className="text-xl font-semibold">Dialog: {id}</h1>

      <div className="flex-1 min-h-[300px] border rounded p-3 overflow-auto bg-gray-50 dark:bg-gray-900">
        {isLoading && <div>Loading…</div>}
        {error && <div className="text-red-500 text-sm">Failed to load.</div>}
        <ul className="space-y-2">
          {(data || []).slice().reverse().map((m: Message) => (
            <li key={m.id} className="bg-white dark:bg-black/20 rounded p-2">
              <div className="text-xs text-gray-500">from {m.sender_id.slice(0,8)}… at {new Date(m.created_at).toLocaleString()}</div>
              {m.deleted_at ? (
                <div className="italic text-gray-400">deleted</div>
              ) : (
                <div className="whitespace-pre-wrap">{m.content || <span className="italic text-gray-400">[attachments only]</span>}</div>
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
          onChange={(e)=>setText(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <input ref={fileRef} type="file" multiple onChange={(e)=>setFiles(Array.from(e.target.files || []))} />
          <button className="px-4 py-2 bg-blue-600 text-white rounded" type="submit">Send</button>
        </div>
        {files.length > 0 && (
          <div className="text-xs text-gray-500">{files.length} file(s) selected</div>
        )}
      </form>
    </div>
  );
}
