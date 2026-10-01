import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { createSessionToken, setSessionCookie } from "@/lib/auth";
import { exchangeCodeForTokens, isGoogleConfigured, verifyGoogleIdToken } from "@/lib/google-auth";
import { serializeDoc } from "@/lib/serialize";

function loginError(origin: string, message: string) {
  const url = new URL("/login", origin);
  url.searchParams.set("error", message);
  const res = NextResponse.redirect(url);
  res.cookies.delete("g_state");
  res.cookies.delete("g_nonce");
  return res;
}

export async function GET(req: NextRequest) {
  const { origin } = req.nextUrl;
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expectedState = req.cookies.get("g_state")?.value;
  const nonce = req.cookies.get("g_nonce")?.value;

  if (!isGoogleConfigured()) {
    return loginError(origin, "Google login isn't configured yet");
  }
  if (!code || !state || !expectedState || !nonce || state !== expectedState) {
    return loginError(origin, "Google sign-in failed — please try again");
  }

  try {
    const redirectUri = `${origin}/api/auth/google/callback`;
    const tokens = await exchangeCodeForTokens(code, redirectUri);
    const profile = await verifyGoogleIdToken(tokens.id_token, nonce);

    if (!profile.email || !profile.email_verified) {
      return loginError(origin, "Your Google account needs a verified email address");
    }

    const db = await getDb();
    const userCount = await db.collection("users").countDocuments();
    let userDoc = await db.collection("users").findOne({ email: profile.email });

    if (!userDoc && userCount === 0) {
      // First ever sign-in with no accounts yet: bootstrap this person as the host.
      const base = profile.email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "") || "host";
      let username = base;
      let n = 1;
      while (await db.collection("users").findOne({ username })) {
        username = `${base}${n++}`;
      }
      const doc = {
        name: profile.name || base,
        username,
        email: profile.email,
        googleId: profile.sub,
        role: "admin" as const,
        createdAt: new Date().toISOString(),
      };
      const result = await db.collection("users").insertOne(doc);
      userDoc = { _id: result.insertedId, ...doc };
    } else if (!userDoc) {
      return loginError(
        origin,
        `No account found for ${profile.email} — ask your host to add you first`
      );
    } else if (!userDoc.googleId) {
      await db.collection("users").updateOne({ _id: userDoc._id }, { $set: { googleId: profile.sub } });
    }

    const user = serializeDoc(userDoc);
    const token = await createSessionToken({
      uid: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
    });
    await setSessionCookie(token);

    const res = NextResponse.redirect(new URL("/", origin));
    res.cookies.delete("g_state");
    res.cookies.delete("g_nonce");
    return res;
  } catch (err) {
    console.error("Google sign-in error:", err);
    return loginError(origin, "Google sign-in failed — please try again");
  }
}
