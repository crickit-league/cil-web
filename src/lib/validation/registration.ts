import { z } from "zod";

// Shared client + server. Matches the Registration model in prisma/schema.prisma
// and the fields the committee confirmed the form should capture (docs/architecture.md §1.1).
export const registrationSchema = z.object({
  teamName: z.string().trim().min(2, "Enter your team name").max(80),
  captainFirstName: z.string().trim().min(1, "Enter the captain's first name").max(50),
  captainLastName: z.string().trim().min(1, "Enter the captain's last name").max(50),
  captainEmail: z.email("Enter a valid email address"),
  captainMobile: z
    .string()
    .trim()
    .min(7, "Enter a valid mobile number")
    .max(20)
    .regex(/^[\d()+\-.\s]+$/, "Use digits and phone punctuation only"),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
