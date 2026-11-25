import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { Session } from "@supabase/supabase-js";
import App from "../App";
import { supabase } from "../data/supabase";
import { createSupabaseRepository } from "../data/supabaseRepository";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setBusy(true); setError("");
    const { error: failure } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (failure) setError("Correo o contraseña incorrectos.");
    setBusy(false);
  }

  return <div className="photorecord pr-login">
    <form className="pr-form pr-login-card" onSubmit={(event) => void submit(event)}>
      <div className="pr-brand-icon" aria-hidden="true">▣</div>
      <h1 className="pr-heading">PhotoRecord</h1>
      <p className="pr-helper">Un rincón solo para dos.</p>
      {error && <p className="pr-error" role="alert">{error}</p>}
      <label className="pr-field">CORREO<input type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
      <label className="pr-field">CONTRASEÑA<input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
      <button className="pr-button" disabled={busy}>{busy ? "Entrando..." : "Entrar"}</button>
    </form>
  </div>;
}

export default function AuthGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;
  const storage = useMemo(() => (supabase && userId ? createSupabaseRepository(supabase) : null), [userId]);

  if (!supabase) return <div className="photorecord pr-login"><p className="pr-error" role="alert">Faltan VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en el archivo .env.</p></div>;
  if (session === undefined) return <div className="photorecord pr-login"><p className="pr-helper">Cargando...</p></div>;
  if (!storage) return <Login />;
  return <App storage={storage} onSignOut={() => void supabase!.auth.signOut()} />;
}
