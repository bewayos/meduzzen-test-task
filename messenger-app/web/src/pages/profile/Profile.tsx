import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";
import { useState } from "react";

interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export default function Profile() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["me"],
    queryFn: () => api<User>("/users/me"),
  });

  const [copied, setCopied] = useState<string | null>(null);
  const [isEditOpen, setEditOpen] = useState(false);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 3000);
  };

  if (isLoading) return <p className="text-center text-gray-400">Loading...</p>;
  if (error || !data) return <p className="text-center text-red-500">Error loading profile</p>;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-md mx-auto bg-white/5 backdrop-blur-md rounded-2xl shadow-lg p-6 text-white">
        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center text-2xl font-bold">
            {data.username?.[0]?.toUpperCase() ?? "?"}
          </div>
          <h2 className="mt-3 text-2xl font-semibold">{data.username}</h2>
          <p className="text-gray-400">{data.email}</p>
        </div>

        {/* Info list */}
        <div className="space-y-3">
          <InfoRow
            label="ID"
            value={data.id}
            onCopy={() => copyToClipboard(data.id, "ID")}
            copied={copied === "ID"}
          />
          <InfoRow
            label="Email"
            value={data.email}
            onCopy={() => copyToClipboard(data.email, "Email")}
            copied={copied === "Email"}
          />
          <InfoRow
            label="Created at"
            value={new Date(data.created_at).toLocaleString()}
          />
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={() => setEditOpen(true)}
            className="px-4 py-2 rounded-lg border border-indigo-500 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-colors"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {isEditOpen && <EditProfileModal onClose={() => setEditOpen(false)} user={data} />}
    </div>
  );
}

function InfoRow({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-center justify-between bg-white/10 px-3 py-2 rounded-md">
      <div>
        <span className="text-gray-400">{label}:</span>{" "}
        <span className="font-mono">{value}</span>
      </div>
      {onCopy && (
        <button
          onClick={onCopy}
          className="relative flex items-center text-sm text-indigo-400 hover:text-indigo-200"
        >
          {/* Default text */}
          <span
            className={`transition-opacity duration-500 ${
              copied ? "opacity-0" : "opacity-100"
            }`}
          >
            Copy
          </span>
          {/* Animated checkmark */}
          <span
            className={`absolute left-0 right-0 text-green-400 transition-opacity duration-300 ${
              copied ? "opacity-100" : "opacity-0"
            }`}
          >
            ✓
          </span>
        </button>
      )}
    </div>
  );
}

function EditProfileModal({ onClose, user }: { onClose: () => void; user: User }) {
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-xl shadow-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold text-white mb-4">Edit Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md px-3 py-2 bg-gray-800 text-white border border-gray-700 focus:border-indigo-500 focus:ring focus:ring-indigo-500/40"
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md px-3 py-2 bg-gray-800 text-white border border-gray-700 focus:border-indigo-500 focus:ring focus:ring-indigo-500/40"
            />
          </div>
        </div>

        {message && (
          <p className="mt-4 text-center text-yellow-400 text-sm">{message}</p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700 text-gray-200 hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              setMessage("🚧 Update profile feature is under development");
              setTimeout(() => {
                setMessage(null);
                onClose();
              }, 2000);
            }}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
