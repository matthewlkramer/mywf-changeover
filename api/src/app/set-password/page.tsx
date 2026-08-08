"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

/**
 * Landing page for Supabase recovery and invite emails: those links redirect
 * here with a session in the URL fragment, which this page exchanges for a
 * session so the person can choose a password. Devise password hashes cannot be
 * imported, so this is how every migrated account gets its first password.
 */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { detectSessionInUrl: true, persistSession: true, flowType: "implicit" } },
);

export default function SetPasswordPage() {
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "saving" | "done" | "invalid">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setEmail(data.session.user.email ?? null);
        setStatus("ready");
      } else {
        setStatus("invalid");
      }
    });
  }, []);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setStatus("ready");
      return;
    }
    setStatus("done");
  }

  return (
    <main style={{ fontFamily: "system-ui", maxWidth: 420, margin: "80px auto", padding: 16 }}>
      <h1 style={{ fontSize: 24, marginBottom: 8 }}>Set your password</h1>

      {status === "loading" && <p>Checking your link…</p>}

      {status === "invalid" && (
        <p>
          This link is expired or already used. Request a new one from the login page, then open the
          most recent email.
        </p>
      )}

      {(status === "ready" || status === "saving") && (
        <form onSubmit={submit}>
          <p style={{ color: "#555" }}>{email}</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="New password"
            minLength={8}
            required
            autoComplete="new-password"
            style={{ width: "100%", padding: 10, fontSize: 16, marginBottom: 12 }}
          />
          <button
            type="submit"
            disabled={status === "saving"}
            style={{ padding: "10px 16px", fontSize: 16 }}
          >
            {status === "saving" ? "Saving…" : "Save password"}
          </button>
          {error && <p style={{ color: "#b00" }}>{error}</p>}
        </form>
      )}

      {status === "done" && (
        <p>
          Password saved for {email}. You can now sign in at{" "}
          <a href="https://mywf-changeover-web.vercel.app/login">the app</a>.
        </p>
      )}
    </main>
  );
}
