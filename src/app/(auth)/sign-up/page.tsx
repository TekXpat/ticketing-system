import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signUp } from "@/lib/auth/actions";

export default function SignUpPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Create an account</h1>
      <AuthForm mode="sign-up" action={signUp} />
      <p className="text-sm">
        Already registered?{" "}
        <Link href="/sign-in" className="text-blue-600 underline">
          Sign in
        </Link>
      </p>
    </section>
  );
}
