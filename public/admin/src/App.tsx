import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import Router from "@/router";
import { useAuthStore } from "@/store/authStore";

export default function App() {
  const restore = useAuthStore((s) => s.restoreSession);

  useEffect(() => {
    restore();
  }, []);

  return (
    <BrowserRouter basename="/admin">
      <Router />
    </BrowserRouter>
  );
}
