import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/lib/auth/actions";

export default function SignUpPage() {
  return (
    <section className="card mx-auto max-w-md space-y-6 p-8">
      <h1 className="text-2xl font-bold">Create an account</h1>
      <AuthForm mode="sign-up" action={signUp} />
      <p className="text-muted text-sm">
        Already registered?{" "}
        <Link href="/sign-in" className="text-brand-soft underline">
          Sign in
        </Link>
      </p>
    </section>
  );
}
