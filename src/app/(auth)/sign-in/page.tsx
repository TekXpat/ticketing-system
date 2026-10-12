import Link from "next/link";
import { AuthForm } from "@/components/auth-form";
import { signIn } from "@/lib/auth/actions";

export default function SignInPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-bold">Sign in</h1>
      <AuthForm mode="sign-in" action={signIn} />
      <p className="text-sm">
        No account?{" "}
        <Link href="/sign-up" className="text-blue-600 underline">
          Sign up
        </Link>
      </p>
    </section>
  );
}
