import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./store/auth";

function Header() {
  const { pathname } = useLocation();
  const token = useAuth((s) => s.token);
  const logout = useAuth((s) => s.logout);
  const nav = useNavigate();

  const linkClasses = (active: boolean) =>
    `px-3 py-1 rounded-md transition-colors ${
      active
        ? "bg-white/20 text-white"
        : "text-white/80 hover:text-white hover:bg-white/10"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/40 backdrop-blur-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold text-white text-lg tracking-wide">
          Messenger
        </Link>
        <nav className="flex items-center gap-2">
          {token ? (
            <>
              <Link to="/chats" className={linkClasses(pathname.startsWith("/chats"))}>
                Chats
              </Link>
              <Link to="/profile" className={linkClasses(pathname.startsWith("/profile"))}>
                Profile
              </Link>
              <button
                onClick={() => { logout(); nav("/auth/login"); }}
                className="px-3 py-1 rounded-md border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/auth/login" className={linkClasses(pathname.startsWith("/auth/login"))}>
                Login
              </Link>
              <Link to="/auth/register" className={linkClasses(pathname.startsWith("/auth/register"))}>
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="min-h-dvh w-full flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
