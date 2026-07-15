import { redirect } from "next/navigation";
import { getSessionValidation } from "@/lib/auth/session";
import { LoginForm } from "@/components/login-form";
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session=await getSessionValidation();
  if(session.kind==="valid")redirect("/app");
  if(session.kind==="invalid")redirect("/auth/clear-session");
  return <main className="centered"><section className="card auth-card stack"><span className="badge">Private access</span><h1>Enter your invite code</h1><p className="muted">Your code opens the player and character assigned to you.</p><LoginForm /></section></main>;
}
