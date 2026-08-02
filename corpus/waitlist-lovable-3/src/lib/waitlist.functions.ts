import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const schema = z.object({
  email: z.string().trim().email().max(255),
});

export const joinWaitlist = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("waitlist")
      .insert({ email: data.email.toLowerCase() });
    if (error) {
      if (error.code === "23505") {
        return { ok: true, already: true };
      }
      throw new Error(error.message);
    }
    return { ok: true, already: false };
  });
