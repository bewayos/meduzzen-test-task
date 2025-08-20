import { useMemo } from "react";
type Attachment = {
  id: string;
  filename: string;
  mime: string;
  size_bytes?: number;
  storage_key: string;
};

function humanSize(bytes?: number) {
  if (!bytes && bytes !== 0) return "";
  const units = ["B","KB","MB","GB"];
  let i = 0, n = bytes;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function AttachmentItem({ att }: { att: Attachment }) {
  const url = useMemo(() => {
    const key = att.storage_key || "";
    if (/^https?:\/\//i.test(key)) return key;
    if (key.startsWith("/")) return key;
    return `/${key.replace(/^\/+/, "")}`;
  }, [att.storage_key]);

  const isImage = att.mime?.startsWith("image/");
  const size = humanSize(att.size_bytes);

  return (
    <div className="flex items-start gap-2 p-2 rounded-lg border border-gray-200/40 bg-white/5">
      {/* Tiny preview for images */}
      {isImage ? (
        <a href={url} target="_blank" rel="noreferrer">
          <img
            src={url}
            alt={att.filename}
            className="h-16 w-16 object-cover rounded-md border"
            loading="lazy"
          />
        </a>
      ) : (
        <div className="h-10 w-10 flex items-center justify-center rounded-md border text-xs">
          {att.mime?.split("/")[1]?.toUpperCase() ?? "FILE"}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-blue-400 hover:underline break-all"
        >
          {att.filename}
        </a>
        {size && <span className="ml-2 text-xs text-gray-400">({size})</span>}

        <div className="mt-1 flex gap-3 text-sm">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Open
          </a>
          {/* `download` hint to browser to save with filename */}
          <a
            href={url}
            download={att.filename}
            className="underline"
          >
            Download
          </a>
        </div>
      </div>
    </div>
  );
}
