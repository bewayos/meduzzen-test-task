import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrGetConversation, listConversations } from "../../api/conversations";
import type { Conversation } from "../../api/conversations";
import { Link } from "react-router-dom";
import { useState } from "react";

export default function Chats() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
  });
  const [peerId, setPeerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null);
    try {
      const conv = await createOrGetConversation(peerId.trim());
      await qc.invalidateQueries({ queryKey: ["conversations"] });
      window.location.href = `/dialog/${conv.id}`;
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Failed to create conversation");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-semibold">Chats</h1>

      <form onSubmit={onCreate} className="flex gap-2">
        <input className="flex-1 border rounded p-2" placeholder="Peer UUID" value={peerId} onChange={(e)=>setPeerId(e.target.value)} />
        <button className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50" disabled={busy || !peerId}>
          Start chat
        </button>
      </form>
      {err && <div className="text-red-500 text-sm">{err}</div>}

      {isLoading && <div>Loading…</div>}
      {error && <div className="text-red-500 text-sm">Failed to load.</div>}
      <ul className="divide-y">
        {(data || []).map((c: Conversation) => (
          <li key={c.id} className="py-3 flex items-center justify-between">
            <div className="text-sm">
              <div className="font-medium">{c.id}</div>
              <div className="text-gray-500">A: {c.user_a_id.slice(0,8)}… · B: {c.user_b_id.slice(0,8)}…</div>
            </div>
            <Link className="text-blue-600 underline" to={`/dialog/${c.id}`}>Open</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
