import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="p-4 bg-neutral-800 text-white flex gap-4">
      <Link to="/conversations">Chats</Link>
      <Link to="/profile">Profile</Link>
    </nav>
  );
}
