"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) return setErr(error.message);

    // If email confirmations are OFF -> user is logged in immediately
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white/10 backdrop-blur rounded-3xl border border-white/10 shadow-2xl p-8">
        <h1 className="text-3xl font-extrabold text-white">Create account</h1>
        <p className="text-white/70 mt-2">Start tracking your progress.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <input
            className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
          <input
            className="w-full rounded-xl bg-white/10 border border-white/10 px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-400"
            placeholder="Password (min 6 chars)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            minLength={6}
            required
          />

          {err && <p className="text-red-300 text-sm">{err}</p>}

          <button
            disabled={loading}
            className="w-full rounded-xl bg-indigo-500 hover:bg-indigo-400 transition text-white font-semibold py-3 disabled:opacity-60"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="text-white/70 text-sm mt-6">
          Already have an account?{" "}
          <Link className="text-indigo-300 hover:text-indigo-200" href="/login">
            Login
          </Link>
        </p>
      </div>
    </main>
  );
}
