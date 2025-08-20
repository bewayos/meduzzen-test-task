import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login } from "../../api/auth";
import { useAuth } from "../../store/auth";
import { Eye, EyeOff } from "lucide-react";

export default function Login() {
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

    if (!username.trim() || !password.trim()) {
      setErr("Please fill in username and password.");
      return;
    }

    try {
      setLoading(true);
      const t = await login(username, password);
      setToken(t.access_token);
      nav("/chats");
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        e?.message ||
        "Login failed. Please try again.";
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
        <h1 className="text-3xl font-bold tracking-tight mb-6">Login</h1>

        {err && (
          <div className="mb-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {err}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="username" className="mb-1 block text-sm text-gray-300">
              Username
            </label>
            <input
              id="username"
              autoComplete="username"
              className="w-full rounded-lg border border-white/10 bg-gray-900/40 px-3 py-2 text-white placeholder-gray-400 outline-none ring-0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
              placeholder="Username"
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
                autoComplete="current-password"
                className="w-full rounded-lg border border-white/10 bg-gray-900/40 px-3 py-2 pr-12 text-white placeholder-gray-400 outline-none ring-0 transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/40"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute inset-y-0 right-2 flex items-center justify-center rounded-md px-2 text-gray-300 hover:bg-white/10 transition-colors"
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                <span
                  className={`block transform transition duration-300 ${
                    showPw ? "rotate-180 scale-90" : "rotate-0 scale-100"
                  }`}
                >
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
          {loading ? "Signing in..." : "Sign in"}
        </button>

        <p className="mt-4 text-center text-sm text-gray-300">
          No account?{" "}
          <Link className="font-medium text-indigo-300 hover:text-indigo-200" to="/auth/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
