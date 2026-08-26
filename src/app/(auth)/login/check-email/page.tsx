import { VerifyCodeForm } from "./verify-code-form";

export default function CheckEmailPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center gap-8 px-5 py-16">
      <div className="text-center">
        <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">Check Your Email</h1>
        <p className="text-chalk-dim mt-2 text-sm">
          Click the link we sent you, or enter the 6-digit code below if you&apos;re checking email on a
          different device.
        </p>
      </div>

      <VerifyCodeForm />
    </div>
  );
}
