import { createSupabaseServerClient } from "@/lib/auth/supabase";
import { NextResponse } from "next/server";
import { z } from "zod";
import { analytics } from "@/lib/analytics";

const CallbackSchema = z
  .object({
    code: z.string().min(1).optional(),
    token_hash: z.string().min(1).optional(),
    type: z.enum(["signup", "recovery", "invite", "email"]).optional().default("signup"),
  })
  .refine((data) => data.code || data.token_hash, {
    message: "Code ou token_hash requis",
  });

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = CallbackSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  }

  const { code, token_hash, type } = parsed.data;
  const supabase = await createSupabaseServerClient();

  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (type === "signup" && data.session?.user) {
      analytics.track("signup", { userId: data.session.user.id });
    }

    return NextResponse.json({ success: true });
  }

  if (token_hash) {
    const otpType = type === "recovery" ? "recovery" : type === "invite" ? "invite" : "signup";
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: otpType,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (type === "signup" && data.session?.user) {
      analytics.track("signup", { userId: data.session.user.id });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") || "/app";

  const supabase = await createSupabaseServerClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (token_hash) {
    const otpType = type === "recovery" ? "recovery" : type === "invite" ? "invite" : "signup";
    const { error } = await supabase.auth.verifyOtp({ token_hash, type: otpType });
    if (!error) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/reset-password`);
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/callback?error=invalid_link`);
}