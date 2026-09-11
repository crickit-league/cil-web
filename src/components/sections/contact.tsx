export function Contact() {
  return (
    <section id="contact" className="scroll-mt-20 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="mb-10 flex max-w-[62ch] flex-col gap-2">
          <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">Get in Touch</span>
          <h2 className="font-display text-[2rem] font-extrabold text-balance uppercase sm:text-[2.75rem]">
            Questions before you register?
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div className="border-line border p-7">
            <span className="font-data text-clay-bright block text-xs tracking-[0.18em] uppercase">
              Committee Inbox
            </span>
            <div className="font-data mt-1.5 text-[1.02rem]">CILcommittee@gmail.com</div>
            <p className="text-chalk-dim mt-4 text-sm">
              Monitored by the CIL committee &mdash; registration, scheduling, and general questions.
            </p>
          </div>
          <div className="border-line border p-7">
            <span className="font-data text-clay-bright block text-xs tracking-[0.18em] uppercase">
              Committee Contact
            </span>
            <div className="font-data mt-1.5 text-[1.02rem]">Naren &middot; +1 (916) 616-9339</div>
            <p className="text-chalk-dim mt-4 text-sm">For anything that needs a faster answer than email.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
