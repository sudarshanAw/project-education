import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createSupabaseServerClient();

  const { data: classes, error } = await supabase
    .from("classes")
    .select("id, name")
    .order("id", { ascending: true });

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">Error: {error.message}</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-blue-600 p-6 sm:p-10">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-6 text-white">Select Your Class</h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {(classes ?? []).map((cls) => (
            <Link
              key={cls.id}
              href={`/class/${cls.id}`}
              className="bg-white rounded-2xl shadow hover:shadow-lg transition p-8 text-center group"
            >
              <div className="text-4xl mb-3">📘</div>
              <div className="text-lg font-semibold group-hover:text-blue-600 transition">
                {cls.name}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
