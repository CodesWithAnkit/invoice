"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const handleLogin = () => {
    if (
      user === process.env.NEXT_PUBLIC_APP_USER &&
      pass === process.env.NEXT_PUBLIC_APP_PASS
    ) {
      localStorage.setItem("invoice_auth", "true");
      router.push("/");
    } else {
      toast.error("Invalid credentials");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center flex-col gap-3 font-sans bg-background text-foreground">
      <div className="p-10 border border-border rounded-lg shadow-sm flex flex-col gap-4 w-[300px] bg-card text-card-foreground">
        <h2 className="m-0 mb-2 text-center text-xl font-bold">Invoice Access</h2>
        <input
          placeholder="Username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="p-2.5 rounded border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          type="password"
          placeholder="Password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="p-2.5 rounded border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={handleLogin}
          className="p-2.5 bg-primary text-primary-foreground border-none rounded font-bold cursor-pointer hover:bg-primary/90 transition-colors"
        >
          Login
        </button>
      </div>
    </div>
  );
}
