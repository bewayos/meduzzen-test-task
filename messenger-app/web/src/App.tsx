import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./store/auth";

function Header() {
  const { pathname } = useLocation();
  const token = useAuth((s) => s.token);
  const logout = useAuth((s) => s.logout);
  const nav = useNavigate();

  return (
    <header className="border-b bg-white">
      <div className="max-w-5xl mx-auto p-3 flex items-center justify-between">
        <Link to="/" className="font-semibold">Messenger</Link>
        <nav className="flex items-center gap-4">
          {token ? (
            <>
              <Link
                to="/chats"
                className={pathname.startsWith("/chats") ? "underline" : ""}
              >
                Chats
              </Link>
              <Link
                to="/profile"
                className={pathname.startsWith("/profile") ? "underline" : ""}
              >
                Profile
              </Link>
              <button
                className="text-red-600"
                onClick={() => {
                  logout();
                  nav("/auth/login");
                }}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/auth/login"
                className={pathname.startsWith("/auth/login") ? "underline" : ""}
              >
                Login
              </Link>
              <Link
                to="/auth/register"
                className={pathname.startsWith("/auth/register") ? "underline" : ""}
              >
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
    <div className="min-h-dvh flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
