import { createSupabaseServerClient } from "@/lib/auth/supabase";
import { NextResponse } from "next/server";
import { z } from "zod";
import { analytics } from "@/lib/analytics";

const CallbackSchema = z.object({
  code: z.string().min(1),
  type: z.enum(["signup", "recovery", "invite"]),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = CallbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const { code, type } = parsed.data;

  const supabase = await createSupabaseServerClient();

  if (type === "signup") {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    if (data.session?.user) {
      analytics.track("signup", { userId: data.session.user.id });
    }
    
    return NextResponse.json({ success: true });
  }

  if (type === "recovery") {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Type non supporté" }, { status: 400 });
}