import { z } from "zod";

export const displayNameSchema = z.object({
  name: z.string().trim().min(1, "Enter your name.").max(80, "Keep it under 80 characters."),
});
