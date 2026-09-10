import { RegistrationForm } from "@/app/(public)/registration-form";

export function Register() {
  return (
    <section id="register" className="bg-pitch-deep scroll-mt-20 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="mb-10 flex max-w-[62ch] flex-col gap-2">
          <span className="font-data text-clay-bright text-xs tracking-[0.18em] uppercase">
            Team Registration
          </span>
          <h2 className="font-display text-[2rem] font-extrabold text-balance uppercase sm:text-[2.75rem]">
            Put your team on the card.
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="border-line bg-dugout flex flex-col gap-6 border p-7">
            <div className="border-line flex items-baseline justify-between border-b pb-4">
              <div>
                <div className="text-base">Standard Entry</div>
                <small className="text-chalk-faint text-sm">Per team, full season</small>
              </div>
              <div className="font-data text-[1.6rem] font-semibold">$650</div>
            </div>
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-base">With Sponsorship</div>
                <small className="text-chalk-faint text-sm">Per team &mdash; details on approval</small>
              </div>
              <div className="font-data text-[1.6rem] font-semibold">$800</div>
            </div>
            <p className="text-chalk-dim text-sm">
              Payment is handled directly with the committee after your registration is submitted &mdash;
              instructions arrive by email. Registration closes{" "}
              <strong className="text-chalk">September 30</strong>; the committee reviews and approves teams
              shortly after.
            </p>
          </div>

          <div id="registration-form" className="scroll-mt-20">
            <RegistrationForm />
          </div>
        </div>
      </div>
    </section>
  );
}
