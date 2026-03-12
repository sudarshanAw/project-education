"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

export default function EsewaSuccessPage() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("Verifying your payment...");

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const data = searchParams.get("data");

        if (!data) {
          setStatus("error");
          setMessage("Missing payment response from eSewa.");
          return;
        }

        const res = await fetch("/api/esewa/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data }),
        });

        const result = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(result?.error || "Payment verification failed.");
          return;
        }

        setStatus("success");
        setMessage("Payment verified successfully.");
      } catch {
        setStatus("error");
        setMessage("Something went wrong while verifying payment.");
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <main className="min-h-screen bg-green-50 flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow p-8 text-center">
        <div className="text-5xl mb-4">
          {status === "loading" ? "⏳" : status === "success" ? "✅" : "❌"}
        </div>

        <h1
          className={`text-2xl font-bold ${
            status === "success"
              ? "text-green-700"
              : status === "error"
              ? "text-red-700"
              : "text-gray-700"
          }`}
        >
          {status === "loading"
            ? "Verifying Payment"
            : status === "success"
            ? "Payment Successful"
            : "Payment Verification Failed"}
        </h1>

        <p className="text-gray-600 mt-3">{message}</p>

        <div className="mt-6">
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-green-600 text-white px-5 py-3 font-semibold hover:bg-green-700"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}