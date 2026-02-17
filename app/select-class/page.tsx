import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import SelectClassGrid from "./select-class-grid";

export default async function SelectClassPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;

  if (!user) redirect("/login");

  // If already selected, go to that class directly
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("selected_class_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.selected_class_id) {
    redirect(`/class/${profile.selected_class_id}`);
  }

  const { data: classes, error } = await supabase
    .from("classes")
    .select("id,name")
    .order("id", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-extrabold text-white">Choose your class</h1>
        <p className="text-white/70 mt-2">
          Pick one to start learning. You can change it later.
        </p>

        <div className="mt-10">
          <SelectClassGrid classes={classes ?? []} />
        </div>
      </div>
    </main>
  );
}
