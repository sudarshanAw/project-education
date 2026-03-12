import Link from "next/link";

export default function EsewaFailurePage() {
  return (
    <main className="min-h-screen bg-red-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow p-8 text-center">
        <div className="text-5xl mb-4">❌</div>
        <h1 className="text-2xl font-bold text-red-700">
          Payment Failed
        </h1>
        <p className="text-gray-600 mt-3">
          Your eSewa payment could not be completed.
        </p>

        <p className="text-sm text-gray-500 mt-4">
          Please try again or return to your class page.
        </p>

        <div className="mt-6 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-gray-700 text-white px-5 py-3 font-semibold hover:bg-gray-800"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}