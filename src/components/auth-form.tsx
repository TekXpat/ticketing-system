"use client";

import { useActionState } from "react";
import type { AuthFormState } from "@/lib/auth/actions";

type Props = {
  mode: "sign-in" | "sign-up";
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
};

export function AuthForm({ mode, action }: Props) {
  const [state, formAction, pending] = useActionState(action, {});
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="max-w-sm space-y-4" noValidate>
      {state.error && (
        <p role="alert" className="rounded bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {mode === "sign-up" && (
        <Field
          label="Name (optional)"
          name="name"
          defaultValue={state.values?.name}
          errors={errors.name}
        />
      )}
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={state.values?.email}
        errors={errors.email}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
        errors={errors.password}
      />

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded bg-gray-900 px-4 py-2 text-white disabled:opacity-50"
      >
        {pending ? "Please wait…" : mode === "sign-up" ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  defaultValue?: string;
  errors?: string[];
};

function Field({ label, name, type = "text", autoComplete, defaultValue, errors }: FieldProps) {
  const errorId = `${name}-error`;
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        aria-invalid={errors ? true : undefined}
        aria-describedby={errors ? errorId : undefined}
        className="w-full rounded border border-gray-300 px-3 py-2"
      />
      {errors && (
        <p id={errorId} className="text-sm text-red-600">
          {errors.join(" ")}
        </p>
      )}
    </div>
  );
}
