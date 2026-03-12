"use client";

import { useState } from "react";

export default function EsewaBuyButton({ classId }: { classId: number }) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function handleEsewaPayment() {
    try {
      setLoading(true);
      setMsg(null);

      const res = await fetch("/api/esewa/initiate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ classId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMsg(data?.error || "Failed to start eSewa payment.");
        setLoading(false);
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.formUrl;

      Object.entries(data.fields).forEach(([key, value]) => {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = String(value);
        form.appendChild(input);
      });

      document.body.appendChild(form);
      form.submit();
    } catch {
      setMsg("Something went wrong while starting payment.");
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      {msg && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {msg}
        </div>
      )}

      <button
        onClick={handleEsewaPayment}
        disabled={loading}
        className="rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white px-5 py-3 font-semibold transition"
      >
        {loading ? "Redirecting to eSewa..." : "Buy with eSewa"}
      </button>
    </div>
  );
}