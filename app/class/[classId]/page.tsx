import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type Params = { classId: string };

export default async function ClassPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { classId } = await params;

  if (!classId) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">classId is missing</p>
      </main>
    );
  }

  const supabase = await createSupabaseServerClient();

  // ✅ Must be logged in
  const { data: auth } = await supabase.auth.getUser();
  const user = auth.user;
  if (!user) redirect("/login");

  // ✅ Must have selected class
  const { data: profile, error: profileErr } = await supabase
    .from("user_profiles")
    .select("selected_class_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileErr) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Profile error: {profileErr.message}</p>
      </main>
    );
  }

  if (!profile?.selected_class_id) redirect("/select-class");

  const requestedClassId = Number(classId);
  const selectedClassId = Number(profile.selected_class_id);

  // ✅ Soft lock: if user tries another class -> force back to selected one
  if (requestedClassId !== selectedClassId) {
    redirect(`/class/${selectedClassId}`);
  }

  // Fetch class name
  const { data: cls } = await supabase
    .from("classes")
    .select("id, name")
    .eq("id", selectedClassId)
    .single();

  // Fetch subjects ONLY for selected class
  const { data: subjects, error } = await supabase
    .from("subjects")
    .select("id, name, class_id, is_preview")
    .eq("class_id", selectedClassId)
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
        <Link href="/dashboard" className="text-blue-600 hover:underline">
          ← Back to Dashboard
        </Link>

        <h1 className="text-3xl font-bold mt-4">
          Subjects - {cls?.name ?? `Class ${selectedClassId}`}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {(subjects ?? []).map((sub: any) => (
            <Link
              key={sub.id}
              href={`/class/${selectedClassId}/subject/${sub.id}`}
              className="bg-white rounded-xl shadow p-5 hover:bg-blue-50 transition"
            >
              <div className="text-lg font-semibold">{sub.name}</div>
              <div className="text-sm text-gray-500 mt-1">
                Click to view chapters
              </div>

              {/* Optional: show preview tag */}
              {sub.is_preview && (
                <div className="mt-3 inline-flex text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800">
                  Preview
                </div>
              )}
            </Link>
          ))}
        </div>

        {(subjects ?? []).length === 0 && (
          <p className="text-gray-600 mt-6">No subjects found for this class.</p>
        )}
      </div>
    </main>
  );
}
