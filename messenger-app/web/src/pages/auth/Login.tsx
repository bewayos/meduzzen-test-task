import { useState } from "react";
import { login } from "../../api/auth";
import { useAuth } from "../../store/auth";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const setToken = useAuth((s) => s.setToken);
  const nav = useNavigate();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    try {
      const t = await login(username, password);
      setToken(t.access_token);
      nav("/chats");
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Login failed");
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3 border rounded-lg p-4">
        <h1 className="text-xl font-semibold">Login</h1>
        {err && <div className="text-red-500 text-sm">{err}</div>}
        <input className="w-full border p-2 rounded" placeholder="Username" value={username} onChange={(e)=>setUsername(e.target.value)} />
        <input className="w-full border p-2 rounded" type="password" placeholder="Password" value={password} onChange={(e)=>setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white rounded p-2" type="submit">Sign in</button>
        <div className="text-sm text-center">
          No account? <Link className="underline" to="/auth/register">Register</Link>
        </div>
      </form>
    </div>
  );
}
