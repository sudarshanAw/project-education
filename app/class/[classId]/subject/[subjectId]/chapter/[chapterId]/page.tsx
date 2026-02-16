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

        <div className="space-y-6 mt-6">
  {(questions ?? []).map((q, index) => (
    <div key={q.id} className="bg-white rounded-2xl shadow p-6">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold text-lg">
          Question {index + 1}
        </h3>
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


        <div className="text-sm text-gray-500 mb-4">
  <Link href="/" className="hover:underline">Classes</Link>
  {" / "}
  <Link href={`/class/${classId}`} className="hover:underline">
    Subjects
  </Link>
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
