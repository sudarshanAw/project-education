import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

type Params = { classId: string };

export default async function ClassPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { classId } = await params;

  // Debug guard
  if (!classId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">classId is missing</p>
      </main>
    );
  }

  const { data: cls } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", Number(classId))
    .single();

  const { data: subjects, error } = await supabase
    .from("subjects")
    .select("id, name, class_id")
    .eq("class_id", Number(classId))
    .order("id", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error loading subjects: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <Link href="/" className="text-blue-600 hover:underline">
          ← Back to Classes
        </Link>

        <h1 className="text-3xl font-bold mt-4">
          Subjects - {cls?.name ?? `Class ${classId}`}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {(subjects ?? []).map((sub) => (
            <Link
              key={sub.id}
              href={`/class/${classId}/subject/${sub.id}`}
              className="bg-white rounded-xl shadow p-5 hover:bg-blue-50 transition"
            >
              <div className="text-lg font-semibold">{sub.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                Click to view chapters
              </div>
            </Link>
          ))}
        </div>

        {(subjects ?? []).length === 0 && (
          <p className="text-gray-600 mt-6">
            No subjects found for this class.
          </p>
        )}
      </div>
    </main>
  );
}
