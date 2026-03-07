"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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
      alert("Invalid credentials");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "12px",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          padding: "40px",
          border: "1px solid #ddd",
          borderRadius: "8px",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          width: "300px",
        }}
      >
        <h2 style={{ margin: "0 0 10px 0", textAlign: "center" }}>Invoice Access</h2>
        <input
          placeholder="Username"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          style={{ padding: "10px", borderRadius: "4px", border: "1px solid #ccc" }}
        />
        <button
          onClick={handleLogin}
          style={{
            padding: "10px",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          Login
        </button>
      </div>
    </div>
  );
}
