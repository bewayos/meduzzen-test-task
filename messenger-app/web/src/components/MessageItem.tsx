import { useState } from "react";
import apiClient from "../api/client";
import type { Message } from "../types";

type Props = {
  message: Message;
  currentUsername: string;
};

export function MessageItem({ message, currentUsername }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content || "");

  const canModify = message.sender.username === currentUsername;

  async function handleSave() {
    await apiClient.patch(
      `/conversations/${message.conversation_id}/messages/${message.id}`,
      { content: editContent }
    );
    setIsEditing(false);
  }

  async function handleDelete() {
    await apiClient.delete(
      `/conversations/${message.conversation_id}/messages/${message.id}`
    );
  }

  return (
    <div className="p-2 rounded-lg hover:bg-gray-50 relative">
      {/* username + час */}
      <div className="text-xs text-gray-600 mb-1">
        {message.sender.username} •{" "}
        {new Date(message.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>

      {isEditing ? (
        <div className="flex gap-2">
          <textarea
            className="border p-1 rounded flex-1"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
          <button onClick={handleSave} className="text-green-600">
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="text-gray-500"
          >
            Cancel
          </button>
        </div>
      ) : (
        <p className={message.deleted_at ? "italic text-gray-400" : ""}>
          {message.deleted_at ? "Message deleted" : message.content}
          {message.edited_at && !message.deleted_at && (
            <span className="ml-1 text-xs text-gray-400">(edited)</span>
          )}
        </p>
      )}

      {/* attachments list */}
      {!!message.attachments?.length && (
        <ul className="mt-1 space-y-1">
          {message.attachments.map((att) => (
            <li key={att.id}>
              <a
                href={att.storage_key}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 underline break-all"
              >
                {att.filename}
              </a>
            </li>
          ))}
        </ul>
      )}

      {canModify && !message.deleted_at && (
        <div className="absolute right-2 top-1 flex gap-2 text-sm">
          <button
            onClick={() => setIsEditing(true)}
            className="text-blue-500"
          >
            Edit
          </button>
          <button onClick={handleDelete} className="text-red-500">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
