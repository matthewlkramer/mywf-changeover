"use client";

import { useState } from "react";

type Resource = { id: string; type: string; attributes: Record<string, unknown> };

type ApiResult = {
  data?: Resource | Resource[];
  meta?: { totalEntries: number };
  errors?: string[];
};

export default function Home() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [result, setResult] = useState<ApiResult | null>(null);
  const [status, setStatus] = useState("");

  async function login() {
    setStatus("signing in…");
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user: { email, password } }),
    });
    const body = await response.json();
    if (!response.ok) {
      setStatus(body.errors?.join(", ") ?? "sign-in failed");
      return;
    }
    setToken(body.token);
    setStatus("signed in");
  }

  async function load(path: string) {
    setStatus(`GET ${path}`);
    const response = await fetch(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    setResult(await response.json());
    setStatus(`GET ${path} → ${response.status}`);
  }

  const rows = Array.isArray(result?.data) ? result.data : result?.data ? [result.data] : [];

  return (
    <main style={{ fontFamily: "system-ui", padding: 32, maxWidth: 900, margin: "0 auto" }}>
      <h1>Wildflower Platform API</h1>
      <p>
        TypeScript reimplementation of the Rails <code>/v1</code> API on Supabase. This page is a
        smoke-test console, not the product UI.
      </p>

      <section style={{ display: "flex", gap: 8, margin: "24px 0" }}>
        <input
          placeholder="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          style={{ padding: 8, flex: 1 }}
        />
        <input
          placeholder="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          style={{ padding: 8, flex: 1 }}
        />
        <button onClick={login} style={{ padding: "8px 16px" }}>
          Sign in
        </button>
      </section>

      <section style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => load("/api/health")}>health</button>
        <button onClick={() => load("/api/v1/users/me")}>me</button>
        <button onClick={() => load("/api/v1/people")}>people</button>
        <button onClick={() => load("/api/v1/schools")}>schools</button>
        <button onClick={() => load("/api/v1/search?q=&models=schools")}>search schools</button>
      </section>

      <p style={{ color: "#555" }}>{status}</p>

      {result?.errors && <pre style={{ color: "#b00" }}>{result.errors.join("\n")}</pre>}

      {rows.length > 0 && (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>id</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>type</th>
              <th style={{ textAlign: "left", borderBottom: "1px solid #ccc" }}>attributes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td style={{ borderBottom: "1px solid #eee" }}>{row.id}</td>
                <td style={{ borderBottom: "1px solid #eee" }}>{row.type}</td>
                <td style={{ borderBottom: "1px solid #eee", fontSize: 12 }}>
                  {JSON.stringify(row.attributes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {result && rows.length === 0 && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </main>
  );
}
