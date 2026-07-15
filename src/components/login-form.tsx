"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ inviteCode: form.get("inviteCode") }) });
      const body = await response.json();
      if (!response.ok) { setError(body.message ?? "Invalid or inactive invite code."); return; }
      router.replace(body.destination ?? "/app"); router.refresh();
    } catch { setError("Kempape is temporarily unavailable."); } finally { setPending(false); }
  }
  return <form className="stack" onSubmit={submit}><label className="stack compact"><span>Invite code</span><input className="field" name="inviteCode" autoComplete="one-time-code" inputMode="text" placeholder="KMP-XXXX-XXXX-XXXX-XXXX" disabled={pending} required /></label>{error && <p className="error" role="alert">{error}</p>}<button className="button" type="submit" disabled={pending}>{pending ? "Checking…" : "Enter"}</button></form>;
}
