"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ClassRow = { id: number; name: string };

export default function SelectClassGrid({ classes }: { classes: ClassRow[] }) {
  const supabase = createSupabaseBrowserClient();
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function chooseClass(classId: number) {
    setErrorMsg(null);
    setLoadingId(classId);

    const { data: auth } = await supabase.auth.getUser();
    const user = auth.user;

    if (!user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase
      .from("user_profiles")
      .upsert(
        {
          user_id: user.id,
          selected_class_id: classId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    setLoadingId(null);

    if (error) {
      setErrorMsg(error.message);
      return;
    }

    router.push(`/class/${classId}`);
    router.refresh();
  }

  return (
    <div>
      {errorMsg && (
        <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8">
        {classes.map((cls) => (
          <button
            key={cls.id}
            onClick={() => chooseClass(cls.id)}
            disabled={loadingId === cls.id}
            className="text-left bg-white/10 border border-white/10 hover:bg-white/15 transition rounded-3xl p-8 backdrop-blur shadow-lg disabled:opacity-60"
          >
            <div className="text-5xl mb-4">📘</div>
            <div className="text-white font-semibold text-lg">{cls.name}</div>
            <div className="text-white/60 text-sm mt-1">
              {loadingId === cls.id ? "Saving…" : "Tap to select"}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
