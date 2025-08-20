import { useParams } from "react-router-dom";
import { useAuth } from "../../store/auth";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  getMessages,
  sendMessage,
  updateMessage,
  deleteMessage,
} from "../../api/messages";
import AttachmentItem from "../../components/AttachmentItem";
import type { Message } from "../../api/messages";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useConversationWS } from "../../hooks/useConversationWS";
import { listConversations } from "../../api/conversations";
import type { Conversation } from "../../api/conversations";

const MAX_MESSAGE_CHARS = 4000;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

const COMPOSER_VH = 15;
const NAVBAR_OFFSET_PX = 64;
const HEADER_GAP_PX = 16;

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
  const [dragOver, setDragOver] = useState(false);
  const [sending, setSending] = useState(false);

  const [errBanner, setErrBanner] = useState<string | null>(null);

  const fileRef = useRef<HTMLInputElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const { data: convs } = useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
  });

  useConversationWS(id, token, (evt) => {
    if (evt?.type === "message:new") {
      qc.invalidateQueries({ queryKey: ["messages", id] });
      queueMicrotask(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      );
    } else if (evt?.type === "message:update") {
      qc.setQueryData(["messages", id], (old: Message[] | undefined) =>
        (old || []).map((m) =>
          m.id === evt.id
            ? { ...m, content: evt.content, edited_at: evt.edited_at }
            : m
        )
      );
    } else if (evt?.type === "message:delete") {
      qc.setQueryData(["messages", id], (old: Message[] | undefined) =>
        (old || []).map((m) =>
          m.id === evt.id ? { ...m, deleted_at: evt.deleted_at } : m
        )
      );
    }
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" as ScrollBehavior });
  }, [data]);

  useEffect(() => {
    if (!errBanner) return;
    const t = setTimeout(() => setErrBanner(null), 6000);
    return () => clearTimeout(t);
  }, [errBanner]);

  function showError(msg: string) {
    setErrBanner(msg);
  }

  function extractApiError(e: any): string {
    const detail =
      e?.response?.data?.detail ??
      e?.response?.data?.message ??
      e?.data?.detail ??
      e?.detail ??
      e?.message;
    return typeof detail === "string" && detail.trim()
      ? detail
      : "Failed to send message.";
  }

  function validateMessageAndFiles(): boolean {
    if (text && text.length > MAX_MESSAGE_CHARS) {
      showError(
        `Message is too long (${text.length} > ${MAX_MESSAGE_CHARS} characters).`
      );
      return false;
    }
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) {
        showError(
          `File "${f.name}" is too large (${formatBytes(
            f.size
          )} > ${formatBytes(MAX_FILE_BYTES)}).`
        );
        return false;
      }
    }
    return true;
  }

  async function onSend(e?: React.FormEvent) {
    e?.preventDefault();
    if (sending) return;

    if (editing) {
      if (!text.trim() || !token) return;
      if (text.length > MAX_MESSAGE_CHARS) {
        showError(
          `Message is too long (${text.length} > ${MAX_MESSAGE_CHARS} characters).`
        );
        return;
      }
      setSending(true);
      try {
        const updated = await updateMessage(editing.id, text, token);
        qc.setQueryData(["messages", id], (old: Message[] | undefined) =>
          (old || []).map((m) => (m.id === updated.id ? updated : m))
        );
        setEditing(null);
        setText("");
      } catch (e) {
        showError(extractApiError(e));
      } finally {
        setSending(false);
      }
      queueMicrotask(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      );
      return;
    }

    if (!text.trim() && files.length === 0) return;
    if (!validateMessageAndFiles()) return;

    setSending(true);
    try {
      await sendMessage(id, { content: text.trim() || undefined, files });
      refetch();
      setText("");
      setFiles([]);
      if (fileRef.current) fileRef.current.value = "";
      queueMicrotask(() =>
        bottomRef.current?.scrollIntoView({ behavior: "smooth" })
      );
    } catch (e) {
      showError(extractApiError(e));
    } finally {
      setSending(false);
    }
  }

  async function onDelete(mid: string) {
    if (!token) return;
    try {
      const deleted = await deleteMessage(mid, token);
      qc.setQueryData(["messages", id], (old: Message[] | undefined) =>
        (old || []).map((m) => (m.id === deleted.id ? deleted : m))
      );
    } catch (e) {
      showError(extractApiError(e));
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
    if (e.key === "Escape" && editing) {
      setEditing(null);
      setText("");
    }
  }

  function withValidatedFiles(list: FileList | File[]) {
    const added = Array.from(list || []);
    const overs = added.filter((f) => f.size > MAX_FILE_BYTES);
    if (overs.length > 0) {
      const names = overs.map((f) => `"${f.name}"`).join(", ");
      showError(
        `Some files are too large ${formatBytes(
          MAX_FILE_BYTES
        )}: ${names}. They were not added.`
      );
    }
    const ok = added.filter((f) => f.size <= MAX_FILE_BYTES);
    if (ok.length) {
      setFiles((prev) => [...prev, ...ok]);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (editing) return;
    withValidatedFiles(e.dataTransfer.files || []);
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

  const lastTime = useMemo(() => {
    const arr = (data || [])
      .slice()
      .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
    const last = arr[arr.length - 1];
    return last ? new Date(last.created_at).toLocaleString() : null;
  }, [data]);

  return (
    <div
      className="mx-auto h-[100vh] max-w-4xl px-4 pb-4"
      style={{ paddingTop: NAVBAR_OFFSET_PX }}
    >
      {/* Error banner (fixed at viewport top) */}
      {errBanner && (
        <div
          className="fixed left-1/2 top-3 z-50 -translate-x-1/2 rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-2 text-sm text-red-200 shadow-lg backdrop-blur-md"
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-start gap-3">
            <span className="mt-0.5">⚠️</span>
            <span className="pr-2">{errBanner}</span>
            <button
              type="button"
              className="ml-auto inline-flex rounded-md border border-red-300/30 px-2 py-0.5 text-xs hover:bg-red-500/10"
              onClick={() => setErrBanner(null)}
              aria-label="Close"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Layout: header / messages / composer */}
      <div className="flex h-full flex-col overscroll-none">
        {/* Conversation header card */}
        <div className="mb-3 mt-2 shrink-0 rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-full from-indigo-500 to-purple-600 bg-gradient-to-br text-white font-semibold text-lg">
              {(peerUsername?.[0] || "?").toUpperCase()}
            </div>
            <div className="flex flex-col leading-tight gap-1">
              <h1 className="text-xl md:text-2xl font-semibold text-white">
                Dialog with {peerUsername || "…"}
              </h1>
              {lastTime && (
                <div className="text-[11px] md:text-xs text-white/70">
                  Last message: {lastTime}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages pane */}
        <div
          className="relative flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md overscroll-contain"
          style={{ marginBottom: HEADER_GAP_PX }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!editing) setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          {dragOver && !editing && (
            <div className="pointer-events-none absolute inset-0 grid place-items-center rounded-2xl border-2 border-dashed border-indigo-400/70 bg-indigo-400/10">
              <span className="text-sm text-indigo-200">Drop files to attach</span>
            </div>
          )}

          {isLoading && <div className="text-sm text-white/60">Loading…</div>}
          {error && <div className="text-sm text-red-400">Failed to load.</div>}

          <ul className="flex flex-col gap-3">
            {(data || [])
              .slice()
              .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at))
              .map((m) => {
                const mine = m.sender_id === userId;
                return (
                  <li key={m.id} className={`group flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={[
                        "max-w-[78%] rounded-2xl px-3 py-2 shadow-sm",
                        mine
                          ? [
                              "bg-indigo-600 text-white",
                              "[&_a]:inline-flex [&_a]:items-center [&_a]:gap-1.5",
                              "[&_a]:text-purple-200 [&_a:hover]:text-purple-100",
                              "[&_a]:underline-offset-2 [&_a:hover]:underline",
                              "[&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-purple-300/50",
                              "[&_button]:inline-flex [&_button]:items-center [&_button]:gap-1.5",
                              "[&_button]:text-purple-200 [&_button:hover]:text-purple-100",
                              "[&_button]:border [&_button]:border-purple-300/40",
                              "[&_button]:bg-indigo-700/40 [&_button:hover]:bg-indigo-700/60",
                              "[&_button:focus-visible]:outline-none [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-purple-300/50",
                            ].join(" ")
                          : [
                              "bg-white/10 text-white border border-white/10",
                              "[&_a]:text-indigo-300 [&_a]:underline-offset-2 [&_a:hover]:underline",
                              "[&_button]:text-indigo-200 [&_button]:border-white/20",
                              "[&_button]:bg-white/10 [&_button:hover]:bg-white/15",
                            ].join(" "),
                      ].join(" ")}
                    >
                      <div className="mb-1 flex items-center gap-2 text-[10px] opacity-80">
                        <span className="font-medium">
                          {m.sender?.username || (mine ? "You" : m.sender_id.slice(0, 8))}
                        </span>
                        <span>•</span>
                        <span>
                          {new Date(m.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {!!m.edited_at && !m.deleted_at && <span className="italic">edited</span>}
                      </div>

                      {m.deleted_at ? (
                        <div className="italic opacity-70">Message deleted</div>
                      ) : (
                        <div className="whitespace-pre-wrap break-words">
                          {m.content || <span className="italic opacity-80">[attachments only]</span>}
                          {!!m.attachments?.length && (
                            <ul className="mt-2 space-y-2">
                              {m.attachments.map((att) => (
                                <li key={att.id}>
                                  {/* @ts-ignore local component path */}
                                  <AttachmentItem att={att} />
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {!m.deleted_at && mine && (
                        <div className="mt-1 hidden gap-3 text-xs opacity-90 group-hover:flex">
                          <button
                            className="underline decoration-white/40 hover:decoration-white"
                            onClick={() => {
                              setEditing(m);
                              setText(m.content || "");
                              textareaRef.current?.focus();
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-200 underline decoration-red-300 hover:text-white hover:decoration-red-200"
                            onClick={() => onDelete(m.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
          </ul>

          <div ref={bottomRef} />
        </div>

        {/* Composer (fixed height in vh) */}
        <form onSubmit={onSend} className="mt-0 shrink-0" style={{ height: `${COMPOSER_VH}vh` }}>
          {editing && (
            <div className="mb-2 flex items-center justify-between rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
              <span className="font-medium">Editing message</span>
              <button
                type="button"
                className="underline"
                onClick={() => {
                  setEditing(null);
                  setText("");
                }}
              >
                Cancel (Esc)
              </button>
            </div>
          )}

          {text.length > 0 && text.length > MAX_MESSAGE_CHARS * 0.95 && (
            <div className="mb-2 rounded-md border border-amber-400/40 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-200">
              Message length: {text.length}/{MAX_MESSAGE_CHARS}
            </div>
          )}

          <div className="flex h-[calc(100%-0rem)] flex-col rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
            <textarea
              ref={textareaRef}
              className="w-full grow resize-none bg-transparent text-white placeholder-white/40 outline-none"
              placeholder={editing ? "Edit your message…" : "Type a message…"}
              style={{ height: `calc(${COMPOSER_VH}vh - 72px)` }}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={onKeyDown}
              disabled={sending}
            />

            {files.length > 0 && !editing && (
              <div className="mt-2 flex flex-wrap gap-2">
                {files.map((f, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white"
                  >
                    {f.name} <span className="opacity-70">({formatBytes(f.size)})</span>
                    <button
                      type="button"
                      className="ml-1 opacity-70 hover:opacity-100"
                      onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-white/80 hover:text-white">
                  <input
                    ref={fileRef}
                    type="file"
                    multiple
                    className="hidden"
                    onChange={(e) => withValidatedFiles(e.target.files || ([] as any))}
                    disabled={!!editing || sending}
                  />
                  <span className="rounded-md border border-white/15 bg-white/10 px-3 py-1">
                    Attach
                  </span>
                </label>
                {files.length > 0 && !editing && (
                  <span className="text-xs text-white/60">{files.length} file(s) selected</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {editing && (
                  <button
                    type="button"
                    className="rounded-lg border border-white/20 px-3 py-1 text-sm text-white/80 hover:bg-white/10"
                    onClick={() => {
                      setEditing(null);
                      setText("");
                    }}
                    disabled={sending}
                  >
                    Cancel
                  </button>
                )}
                <button
                  className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
                  type="submit"
                  disabled={sending || (!editing && text.trim() === "" && files.length === 0)}
                >
                  {sending ? (editing ? "Saving…" : "Sending…") : editing ? "Save" : "Send"}
                </button>
              </div>
            </div>
          </div>
          <p className="mt-1 text-xs text-white/50">
            Enter — send • Shift+Enter — new line • Drag & drop files into the chat
          </p>
        </form>
      </div>
    </div>
  );
}

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  const kb = n / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}
