import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

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

  const { data: subject } = await supabase
    .from("subjects")
    .select("id, name, class_id")
    .eq("id", subjectId)
    .single();

  const { data: chapters, error } = await supabase
    .from("chapters")
    .select("id, name")
    .eq("subject_id", subjectId)
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
        <Link href={`/class/${classId}`} className="text-blue-600 hover:underline">
          ← Back to Subjects
        </Link>

        <h1 className="text-3xl font-bold mt-4">
          Chapters - {subject?.name ?? `Subject ${subjectId}`}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {(chapters ?? []).map((ch) => (
            <Link
              key={ch.id}
              href={`/class/${classId}/subject/${subjectId}/chapter/${ch.id}`}
              className="bg-white rounded-xl shadow p-5 hover:bg-blue-50 transition"
            >
              <div className="text-lg font-semibold">{ch.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                View questions
              </div>
            </Link>
          ))}
        </div>

        <div className="text-sm text-gray-500 mb-4">
  <Link href="/" className="hover:underline">Classes</Link>
  {" / "}
  <Link href={`/class/${classId}`} className="hover:underline">
    Subjects
  </Link>
</div>

        {(chapters ?? []).length === 0 && (
          <p className="text-gray-600 mt-6">No chapters found for this subject.</p>
        )}
      </div>
    </main>
  );
}