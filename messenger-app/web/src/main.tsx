import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Chats from "./pages/chats/Chats";
import Dialog from "./pages/dialog/Dialog";
import Profile from "./pages/profile/Profile";
import { useAuth } from "./store/auth";

const qc = new QueryClient();

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const token = useAuth.getState().token;
  return token ? children : <Navigate to="/auth/login" replace />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/chats" replace /> },
      { path: "auth/login", element: <Login /> },
      { path: "auth/register", element: <Register /> },
      { path: "chats", element: <PrivateRoute><Chats /></PrivateRoute> },
      { path: "dialog/:id", element: <PrivateRoute><Dialog /></PrivateRoute> },
      { path: "profile", element: <PrivateRoute><Profile /></PrivateRoute> },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={qc}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
);
