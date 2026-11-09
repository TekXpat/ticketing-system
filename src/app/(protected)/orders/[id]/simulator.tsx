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

  return (
    <div className="space-y-3">
      <p className="text-muted text-sm">Mock mobile money provider: choose what it reports.</p>
      <div className="flex flex-wrap gap-2">
        <button className="btn btn-primary" disabled={pending} onClick={() => send("success")}>
          Success
        </button>
        <button className="btn btn-outline" disabled={pending} onClick={() => send("failed")}>
          Failure
        </button>
        <button className="btn btn-outline" disabled={pending} onClick={() => send("timeout")}>
          Timeout
        </button>
        <button className="btn btn-outline" disabled={pending} onClick={() => send("success", 5)}>
          Send success 5 times at once
        </button>
      </div>
      {message ? (
        <p role="status" className="alert-warning">
          {message}
        </p>
      ) : null}
    </div>
  );
}
