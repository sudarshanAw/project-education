import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/login");

  // ✅ Onboarding check: if no selected class -> choose class
  const { data: profile, error: profileErr } = await supabase
    .from("user_profiles")
    .select("selected_class_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileErr) {
    // if profile table has RLS misconfig etc, show error instead of infinite redirect
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Profile error: {profileErr.message}</p>
      </main>
    );
  }

  if (!profile?.selected_class_id) redirect("/select-class");
  const classId = profile.selected_class_id;

  // Fetch class name
  const { data: cls } = await supabase
    .from("classes")
    .select("id,name")
    .eq("id", classId)
    .single();

  // ✅ Total questions in this class (no view needed)
  // This joins: questions -> chapters -> subjects and filters by subjects.class_id
  const { count: totalQuestions } = await supabase
    .from("questions")
    .select("id, chapters!inner(subject_id, subjects!inner(class_id))", {
      count: "exact",
      head: true,
    })
    .eq("chapters.subjects.class_id", classId);

  // ✅ Get list of question ids in this class (lightweight)
  const { data: qRows, error: qErr } = await supabase
    .from("questions")
    .select("id, chapters!inner(subjects!inner(class_id))")
    .eq("chapters.subjects.class_id", classId);

  if (qErr) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Questions error: {qErr.message}</p>
      </main>
    );
  }

  const classQuestionIds = (qRows ?? []).map((r: any) => r.id);

  // Attempted in this class
  const { count: attempted } = await supabase
    .from("user_question_progress")
    .select("question_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .in("question_id", classQuestionIds.length ? classQuestionIds : [-1]);

  // Correct in this class
  const { count: correct } = await supabase
    .from("user_question_progress")
    .select("question_id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "correct")
    .in("question_id", classQuestionIds.length ? classQuestionIds : [-1]);

  // Recent activity (last 5 attempts)
  const { data: recent } = await supabase
    .from("user_question_progress")
    .select("question_id,status,updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(5);

  const total = totalQuestions ?? 0;
  const att = attempted ?? 0;
  const cor = correct ?? 0;
  const completion = total > 0 ? Math.round((att / total) * 100) : 0;
  const accuracy = att > 0 ? Math.round((cor / att) * 100) : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              Dashboard
            </h1>
            <p className="text-white/70 mt-2">
              Welcome, <span className="text-white/90">{user.email}</span>
            </p>
          </div>

          <form action="/api/auth/logout" method="post">
            <button className="rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-white hover:bg-white/15 transition">
              Logout
            </button>
          </form>
        </div>

        {/* Current class */}
        <div className="mt-8 rounded-3xl bg-white/10 border border-white/10 backdrop-blur p-6 sm:p-8 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="text-white/70 text-sm">Your class</div>
              <div className="text-white text-2xl font-bold mt-1">
                {cls?.name ?? `Class ${classId}`}
              </div>
              <div className="text-white/60 text-sm mt-2">
                Completion:{" "}
                <span className="text-white/90 font-semibold">{completion}%</span>{" "}
                • Accuracy:{" "}
                <span className="text-white/90 font-semibold">{accuracy}%</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Link
                href={`/class/${classId}`}
                className="rounded-xl bg-indigo-500 hover:bg-indigo-400 transition text-white font-semibold px-5 py-3"
              >
                Continue Learning →
              </Link>

              <Link
                href="/select-class"
                className="rounded-xl bg-white/10 border border-white/10 text-white hover:bg-white/15 transition px-5 py-3"
              >
                Change Class
              </Link>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-6">
            <div className="h-3 w-full rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-3 rounded-full bg-indigo-400"
                style={{ width: `${completion}%` }}
              />
            </div>
            <div className="mt-3 text-white/70 text-sm">
              {att} / {total} questions attempted
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Attempted" value={`${att}`} subtitle="Questions attempted" />
          <StatCard title="Completion" value={`${completion}%`} subtitle="For selected class" />
          <StatCard title="Accuracy" value={`${accuracy}%`} subtitle="Based on attempts" />
        </div>

        {/* Recent activity */}
        <div className="mt-8 rounded-3xl bg-white/10 border border-white/10 backdrop-blur p-6 sm:p-8 shadow-2xl">
          <div className="text-white font-semibold text-xl">Recent Activity</div>
          <div className="text-white/60 text-sm mt-1">Your latest attempts</div>

          <div className="mt-6 space-y-3">
            {(recent ?? []).length === 0 ? (
              <div className="text-white/70">No activity yet. Start learning!</div>
            ) : (
              (recent ?? []).map((r: any) => (
                <div
                  key={`${r.question_id}-${r.updated_at}`}
                  className="flex items-center justify-between rounded-2xl bg-white/5 border border-white/10 p-4"
                >
                  <div className="text-white/80">
                    Question #{r.question_id}
                    <div className="text-white/50 text-xs mt-1">
                      {new Date(r.updated_at).toLocaleString()}
                    </div>
                  </div>
                  <div className="text-white/80 font-semibold">{r.status}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

function StatCard({ title, value, subtitle }: { title: string; value: string; subtitle: string }) {
  return (
    <div className="rounded-3xl bg-white/10 border border-white/10 backdrop-blur p-6 shadow-2xl">
      <div className="text-white/60 text-sm">{title}</div>
      <div className="text-white text-3xl font-extrabold mt-2">{value}</div>
      <div className="text-white/60 text-sm mt-2">{subtitle}</div>
    </div>
  );
}
