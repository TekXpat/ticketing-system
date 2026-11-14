"use client";

import { useState } from "react";
import { ProfileForm } from "./profile-form";

type Props = {
  email: string;
  createdAt: string;
  initialName: string;
};

export function ExpandDetails({ email, createdAt, initialName }: Props) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Account Details</h2>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-brand text-sm hover:underline"
        >
          {expanded ? "Hide details" : "View account details"}
        </button>
      </div>

      {expanded && (
        <div className="border-line space-y-4 border-t pt-4">
          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted w-32 shrink-0">Email</dt>
              <dd className="font-medium" data-testid="account-email">
                {email}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted w-32 shrink-0">Member since</dt>
              <dd className="font-medium">{createdAt}</dd>
            </div>
          </dl>

          <div className="space-y-2">
            <p className="text-sm font-medium">Display name</p>
            <ProfileForm initialName={initialName} />
          </div>
        </div>
      )}
    </div>
  );
}
