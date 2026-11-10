import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/src/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const requestedNext = requestUrl.searchParams.get("next") ?? "/";
  const next = requestedNext.startsWith("/") ? requestedNext : "/";

  if (code) {
    const client = await createSupabaseServerClient();
    const { error } = (await client?.auth.exchangeCodeForSession(code)) ?? {
      error: new Error("Supabase is not configured."),
    };
    if (!error) return NextResponse.redirect(new URL(next, requestUrl.origin));
  }

  const destination = new URL("/", requestUrl.origin);
  destination.searchParams.set(
    "auth_error",
    "Social sign-in could not be completed. Check the Supabase provider and redirect settings.",
  );
  return NextResponse.redirect(destination);
}
