import { useQuery } from "@tanstack/react-query";
import { api } from "../../lib/api";

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

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p>Error loading profile</p>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Profile</h1>
      <p><strong>ID:</strong> {data!.id}</p>
      <p><strong>Email:</strong> {data!.email}</p>
      <p><strong>Username:</strong> {data!.username}</p>
      <p><strong>Created at:</strong> {new Date(data!.created_at).toLocaleString()}</p>
    </div>
  );
}
