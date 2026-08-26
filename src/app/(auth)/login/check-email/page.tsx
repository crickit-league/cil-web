export default function CheckEmailPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center gap-3 px-5 py-16 text-center">
      <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">Check Your Email</h1>
      <p className="text-chalk-dim text-sm">
        A sign-in link is on its way. It expires shortly, so use it soon — and check spam if it doesn&apos;t
        show up in a minute or two.
      </p>
    </div>
  );
}
