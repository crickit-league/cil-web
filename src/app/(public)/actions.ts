"use server";

import { z } from "zod";
import { registrationSchema } from "@/lib/validation/registration";
import { NoOpenSeasonError, submitRegistration } from "@/lib/services/registrations";

export type RegistrationFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof registrationSchema>, string>>;
};

export async function submitRegistrationAction(
  _prev: RegistrationFormState,
  formData: FormData,
): Promise<RegistrationFormState> {
  const parsed = registrationSchema.safeParse({
    teamName: formData.get("teamName"),
    captainName: formData.get("captainName"),
    captainEmail: formData.get("captainEmail"),
    captainMobile: formData.get("captainMobile"),
    viceCaptainName: formData.get("viceCaptainName"),
    viceCaptainEmail: formData.get("viceCaptainEmail"),
    viceCaptainMobile: formData.get("viceCaptainMobile"),
    feeTier: formData.get("feeTier"),
    marketingConsent: formData.get("marketingConsent") === "on",
  });

  if (!parsed.success) {
    const fieldErrors: RegistrationFormState["fieldErrors"] = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof typeof fieldErrors | undefined;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { status: "error", message: "Check the highlighted fields.", fieldErrors };
  }

  try {
    await submitRegistration(parsed.data);
    // TODO: Cloudflare Turnstile before this ships live
  } catch (error) {
    if (error instanceof NoOpenSeasonError) {
      return { status: "error", message: error.message };
    }
    console.error("Registration submission failed:", error);
    return {
      status: "error",
      message:
        "Something went wrong submitting your registration. Please try again or email CILcommittee@gmail.com.",
    };
  }

  return { status: "success", message: "Registration received — check your email for next steps." };
}
