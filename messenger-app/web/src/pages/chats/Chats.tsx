import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createOrGetConversation, listConversations } from "../../api/conversations";
import type { Conversation } from "../../api/conversations";
import { useAuth } from "../../store/auth";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function stringToHsl(input: string, s = 60, l = 50) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) hash = input.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue} ${s}% ${l}%)`;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function Chats() {
  const qc = useQueryClient();
  const token = useAuth((s) => s.token);

  const { data, isLoading, error } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
  });

  const [peerId, setPeerId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState<"me" | "peer" | null>(null);

  const userId = useMemo(() => {
    if (!token) return null;
    try {
      return JSON.parse(atob(token.split(".")[1])).sub as string;
    } catch {
      return null;
    }
  }, [token]);

  async function onCreate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!UUID_RE.test(peerId.trim())) {
      setErr("Please provide a valid UUID.");
      return;
    }

    setBusy(true);
    try {
      const conv = await createOrGetConversation(peerId.trim());
      await qc.invalidateQueries({ queryKey: ["conversations"] });
      window.location.href = `/dialog/${conv.id}`;
    } catch (e: any) {
      setErr(e?.response?.data?.detail || String(e) || "Failed to create conversation");
    } finally {
      setBusy(false);
    }
  }

  const onPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setPeerId(text.trim());
      setCopied("peer");
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* ignore */
    }
  };

  const copyMyId = async () => {
    if (!userId) return;
    await navigator.clipboard.writeText(userId);
    setCopied("me");
    setTimeout(() => setCopied(null), 1500);
  };

  const conversations = data ?? [];
  const convCount = conversations.length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">Chats</h1>
      </div>

      {/* Start new chat card */}
      <div className="mb-8 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
        {/* My ID */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-white/60">Your ID:</span>
          <code className="rounded bg-black/30 px-2 py-1 text-xs text-white">
            {userId ?? "unknown"}
          </code>
          <button
            type="button"
            onClick={copyMyId}
            className="rounded border border-white/20 px-2 py-1 text-xs text-white/80 hover:bg-white/10"
          >
            {copied === "me" ? "Copied" : "Copy"}
          </button>
        </div>

        {/* New chat form */}
        <form onSubmit={onCreate} className="flex flex-wrap items-center gap-2">
          <input
            className="flex-1 rounded-lg border border-white/20 bg-black/30 px-3 py-2 text-sm text-white placeholder-white/50 focus:border-white/40 outline-none"
            placeholder="Peer UUID"
            value={peerId}
            onChange={(e) => setPeerId(e.target.value)}
          />
          <button
            type="button"
            onClick={onPaste}
            className="rounded-lg border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            {copied === "peer" ? "Pasted" : "Paste"}
          </button>
          <button
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium",
              busy
                ? "bg-blue-500/60 text-white/80 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-500"
            )}
            disabled={busy || !peerId}
          >
            {busy && (
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
            )}
            Start chat
          </button>
        </form>

        {err && <div className="mt-2 text-xs text-red-400">{err}</div>}
      </div>

      {/* Conversations list */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-white/10 bg-white/5"
            />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-200">
          Failed to load conversations.
        </div>
      ) : convCount === 0 ? (
        <EmptyState />
      ) : convCount === 1 ? (
        <div className="rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
          {renderConversation(conversations[0], userId)}
        </div>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {conversations.map((c) => (
            <li key={c.id}>{renderConversation(c, userId)}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-white/70">
      <div className="mx-auto mb-3 h-12 w-12 rounded-full border border-white/20 bg-white/10" />
      <h3 className="text-lg font-semibold text-white">No conversations yet</h3>
      <p className="mt-1 text-sm">
        Paste a peer UUID above and press <span className="text-white">Start chat</span>.
      </p>
    </div>
  );
}

function renderConversation(c: Conversation, userId: string | null) {
  const peer = userId && c.user_a?.id === userId ? c.user_b : c.user_a;
  const peerName = peer?.username || "Unknown";
  const initials = peerName?.[0]?.toUpperCase() || "?";
  const color = stringToHsl(peerName || c.id);

  return (
    <div className="group flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-colors hover:bg-white/10">
      <div className="flex items-center gap-3">
        <div
          className="flex h-10 w-10 select-none items-center justify-center rounded-full text-sm font-bold text-white shadow"
          style={{ background: color }}
        >
          {initials}
        </div>
        <div className="text-sm">
          <div className="font-medium text-white">Dialog with {peerName}</div>
          <div className="text-white/60">
            A: {c.user_a?.username ?? "—"} · B: {c.user_b?.username ?? "—"}
          </div>
        </div>
      </div>
      <Link
        to={`/dialog/${c.id}`}
        className="rounded-lg border border-white/20 px-3 py-1.5 text-sm text-white/80 transition-colors hover:bg-white/10 hover:text-white"
      >
        Open
      </Link>
    </div>
  );
}
