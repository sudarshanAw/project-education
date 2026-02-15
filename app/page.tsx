import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default async function Home() {
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
    <main className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold text-blue-600 mb-4">
        Project Education
      </h1>
      <p className="text-gray-700 mb-8">Select your Class to begin learning.</p>

      <div className="grid grid-cols-2 gap-6">
        {(classes ?? []).map((cls) => (
          <Link
            key={cls.id}
            href={`/class/${cls.id}`}
            className="bg-white shadow-md rounded-xl p-6 text-center text-lg font-semibold hover:bg-blue-100 transition"
          >
            {cls.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
