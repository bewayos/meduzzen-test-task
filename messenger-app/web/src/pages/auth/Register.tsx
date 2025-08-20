import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register as registerApi } from "../../api/auth";
import { useAuth } from "../../store/auth";
import { Eye, EyeOff } from "lucide-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const setToken = useAuth((s) => s.setToken);
  const nav = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (!email.trim() || !username.trim() || !password.trim()) {
      setErr("Please fill in all fields.");
      return;
    }

    try {
      setLoading(true);
      const t = await registerApi({ email, username, password });
      setToken(t.access_token);
      nav("/chats");
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Registration failed. Please try again.";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-dvh flex items-center justify-center px-4">
      {/* subtle background accent */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-600/10 via-transparent to-transparent" />

      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-xl p-6 sm:p-8 text-white"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-6">Create account</h1>

        {err && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-white/10 bg-gray-900/40 px-3 py-2 text-white placeholder-gray-400 outline-none ring-0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="username" className="mb-1 block text-sm text-gray-300">
              Username
            </label>
            <input
              id="username"
              autoComplete="username"
              className="w-full rounded-lg border border-white/10 bg-gray-900/40 px-3 py-2 text-white placeholder-gray-400 outline-none ring-0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              placeholder="Your nickname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-gray-300">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="new-password"
                className="w-full rounded-lg border border-white/10 bg-gray-900/40 px-3 py-2 pr-12 text-white placeholder-gray-400 outline-none ring-0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center justify-center rounded-md px-2 text-gray-300 hover:bg-white/10 transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                <span className="transition-opacity duration-200">
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </span>
              </button>
            </div>
          </div>
        </div>

        <button
          className="mt-6 w-full rounded-lg bg-indigo-600 px-4 py-2 font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating..." : "Create account"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-300">
          Have an account?{" "}
          <Link className="font-medium text-indigo-300 hover:text-indigo-200" to="/auth/login">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
}
