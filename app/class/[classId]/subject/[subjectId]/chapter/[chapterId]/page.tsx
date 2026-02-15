import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default async function ChapterPage({
  params,
}: {
  params: Promise<{ classId: string; subjectId: string; chapterId: string }>;
}) {
  const { classId, subjectId, chapterId } = await params;

  const { data: chapter } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("id", chapterId)
    .single();

  const { data: questions, error } = await supabase
    .from("questions")
    .select("id, question, answer, difficulty")
    .eq("chapter_id", chapterId)
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
        <Link
          href={`/class/${classId}/subject/${subjectId}`}
          className="text-blue-600 hover:underline"
        >
          ← Back to Chapters
        </Link>

        <h1 className="text-3xl font-bold mt-4">
          Questions - {chapter?.name ?? `Chapter ${chapterId}`}
        </h1>

        <div className="space-y-4 mt-6">
          {(questions ?? []).map((q) => (
            <details key={q.id} className="bg-white rounded-xl shadow p-4">
              <summary className="cursor-pointer font-semibold">
                {q.question}
                {q.difficulty ? (
                  <span className="ml-3 text-xs text-gray-500">
                    ({q.difficulty})
                  </span>
                ) : null}
              </summary>
              <div className="mt-3 text-gray-800 whitespace-pre-wrap">
                {q.answer}
              </div>
            </details>
          ))}
        </div>

        {(questions ?? []).length === 0 && (
          <p className="text-gray-600 mt-6">
            No questions found for this chapter.
          </p>
        )}
      </div>
    </main>
  );
}
