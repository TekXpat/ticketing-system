"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { simulatePayment } from "@/lib/payments/simulate";

export function Simulator({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function send(outcome: "success" | "failed" | "timeout", times = 1) {
    startTransition(async () => {
      const result = await simulatePayment(orderId, outcome, times);
      setMessage(result.ok ? result.message : result.error);
      router.refresh();
    });
  }

  const button = "rounded border border-gray-400 px-3 py-2 text-sm disabled:opacity-50";

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">Mock mobile money provider: choose what it reports.</p>
      <div className="flex flex-wrap gap-2">
        <button className={button} disabled={pending} onClick={() => send("success")}>
          Success
        </button>
        <button className={button} disabled={pending} onClick={() => send("failed")}>
          Failure
        </button>
        <button className={button} disabled={pending} onClick={() => send("timeout")}>
          Timeout
        </button>
        <button className={button} disabled={pending} onClick={() => send("success", 5)}>
          Send success 5 times at once
        </button>
      </div>
      {message ? (
        <p role="status" className="text-sm font-medium">
          {message}
        </p>
      ) : null}
    </div>
  );
}
