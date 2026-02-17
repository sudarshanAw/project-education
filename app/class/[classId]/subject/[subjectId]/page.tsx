import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ classId: string; subjectId: string }>;
}) {
  const { classId, subjectId } = await params;

  if (!classId || !subjectId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">
          Missing params: classId={String(classId)} subjectId={String(subjectId)}
        </p>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();

  // ✅ Must be logged in
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/login");

  // ✅ Must have selected class
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("selected_class_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.selected_class_id) redirect("/select-class");

  const selectedClassId = Number(profile.selected_class_id);
  const requestedClassId = Number(classId);

  // ✅ Soft lock: if user tries another class -> force back
  if (requestedClassId !== selectedClassId) {
    redirect(`/class/${selectedClassId}`);
  }

  // ✅ Load subject and ensure it belongs to selected class
  const { data: subject, error: subjectErr } = await supabase
    .from("subjects")
    .select("id, name, class_id")
    .eq("id", Number(subjectId))
    .single();

  if (subjectErr) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error loading subject: {subjectErr.message}</p>
      </main>
    );
  }

  if (!subject || Number(subject.class_id) !== selectedClassId) {
    // Subject doesn't belong to this class -> redirect safely
    redirect(`/class/${selectedClassId}`);
  }

  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, name, is_preview")
    .eq("subject_id", Number(subjectId))
    .order("id", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error loading chapters: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="text-sm text-gray-500 mb-4">
          <Link href="/dashboard" className="hover:underline">Dashboard</Link>
          {" / "}
          <Link href={`/class/${selectedClassId}`} className="hover:underline">
            Subjects
          </Link>
          {" / "}
          <span>Chapters</span>
        </div>

        <Link href={`/class/${selectedClassId}`} className="text-blue-600 hover:underline">
          ← Back to Subjects
        </Link>

        <h1 className="text-3xl font-bold mt-4">
          Chapters - {subject?.name ?? `Subject ${subjectId}`}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {(chapters ?? []).map((ch: any) => (
            <Link
              key={ch.id}
              href={`/class/${selectedClassId}/subject/${subjectId}/chapter/${ch.id}`}
              className="bg-white rounded-xl shadow p-5 hover:bg-blue-50 transition"
            >
              <div className="text-lg font-semibold">{ch.name}</div>
              <div className="text-sm text-gray-500 mt-1">View questions</div>

              {/* Optional: preview tag */}
              {ch.is_preview && (
                <div className="mt-3 inline-flex text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                  Preview
                </div>
              )}
            </Link>
          ))}
        </div>

        {(chapters ?? []).length === 0 && (
          <p className="text-gray-600 mt-6">No chapters found for this subject.</p>
        )}
      </div>
    </main>
  );
}
