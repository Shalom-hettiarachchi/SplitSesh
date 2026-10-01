import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { buildGoogleAuthUrl, isGoogleConfigured } from "@/lib/google-auth";

export async function GET(req: Request) {
  if (!isGoogleConfigured()) {
    return NextResponse.json(
      { error: "Google login isn't configured yet. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET." },
      { status: 500 }
    );
  }

  const url = new URL(req.url);
  const redirectUri = `${url.origin}/api/auth/google/callback`;
  const state = randomUUID();
  const nonce = randomUUID();
  const authUrl = buildGoogleAuthUrl({ state, nonce, redirectUri });

  const res = NextResponse.redirect(authUrl);
  res.cookies.set("g_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  res.cookies.set("g_nonce", nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}
