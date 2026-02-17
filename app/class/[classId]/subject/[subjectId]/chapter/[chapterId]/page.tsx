import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ classId: string; subjectId: string; chapterId: string }>;
}) {
  const { classId, subjectId, chapterId } = await params;

  if (!classId || !subjectId || !chapterId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">
          Missing params: classId={String(classId)} subjectId={String(subjectId)} chapterId={String(chapterId)}
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

  // ✅ Validate subject belongs to selected class
  const { data: subject, error: subjectErr } = await supabase
    .from("subjects")
    .select("id, class_id, name")
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
    redirect(`/class/${selectedClassId}`);
  }

  // ✅ Validate chapter belongs to the subject in URL
  const { data: chapter, error: chapterErr } = await supabase
    .from("chapters")
    .select("id, name, subject_id")
    .eq("id", Number(chapterId))
    .single();

  if (chapterErr) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error loading chapter: {chapterErr.message}</p>
      </main>
    );
  }

  if (!chapter || Number(chapter.subject_id) !== Number(subjectId)) {
    // chapter isn't under this subject -> redirect to correct subject
    redirect(`/class/${selectedClassId}/subject/${subjectId}`);
  }

  // ✅ Load questions for this chapter
  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, question, answer, difficulty")
    .eq("chapter_id", Number(chapterId))
    .order("id", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error: {error.message}</p>
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
          <Link href={`/class/${selectedClassId}`} className="hover:underline">Subjects</Link>
          {" / "}
          <Link href={`/class/${selectedClassId}/subject/${subjectId}`} className="hover:underline">
            Chapters
          </Link>
          {" / "}
          <span>Questions</span>
        </div>

        <Link
          href={`/class/${selectedClassId}/subject/${subjectId}`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Chapters
        </Link>

        <h1 className="text-3xl font-bold mt-4">
          Questions - {chapter?.name ?? `Chapter ${chapterId}`}
        </h1>

        <div className="space-y-6 mt-6">
          {(questions ?? []).map((q: any, index: number) => (
            <div key={q.id} className="bg-white rounded-2xl shadow p-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">Question {index + 1}</h3>
                <span className="text-xs px-3 py-1 bg-blue-100 text-blue-600 rounded-full">
                  {q.difficulty}
                </span>
              </div>

              <p className="mt-3 text-gray-800">{q.question}</p>

              <details className="mt-4">
                <summary className="cursor-pointer text-blue-600 font-medium">
                  Show Answer
                </summary>
                <div className="mt-3 p-4 bg-gray-50 rounded-lg">
                  {q.answer}
                </div>
              </details>
            </div>
          ))}
        </div>

        {(questions ?? []).length === 0 && (
          <p className="text-gray-600 mt-6">No questions found for this chapter.</p>
        )}
      </div>
    </main>
  );
}
