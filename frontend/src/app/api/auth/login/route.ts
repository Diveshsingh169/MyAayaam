import { NextRequest, NextResponse } from "next/server";
import { backendURL, setAuthCookies } from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; remember?: boolean };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Please enter a valid request." }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";

  if (!email || !password) {
    return NextResponse.json({ message: "Email and password are required." }, { status: 400 });
  }

  try {
    const backendResponse = await fetch(backendURL("/api/v1/auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    const payload = await backendResponse.json().catch(() => null);

    if (!backendResponse.ok) {
      const message =
        typeof payload?.message === "string"
          ? payload.message
          : typeof payload?.error === "string"
            ? payload.error
            : backendResponse.status === 401
              ? "The email or password you entered is incorrect."
              : backendResponse.status === 403
                ? "This account is inactive. Please contact your administrator."
                : "We couldn't sign you in. Please try again.";
      return NextResponse.json({ message }, { status: backendResponse.status });
    }

    if (
      typeof payload?.access_token !== "string" ||
      typeof payload?.refresh_token !== "string" ||
      !payload.user
    ) {
      return NextResponse.json({ message: "The authentication server returned an invalid response." }, { status: 502 });
    }

    const response = NextResponse.json({ user: payload.user }, { status: 200 });
    response.headers.set("Cache-Control", "no-store");
    setAuthCookies(
      response,
      { access_token: payload.access_token, refresh_token: payload.refresh_token },
      body.remember === true,
    );
    return response;
  } catch {
    return NextResponse.json(
      { message: "Unable to reach MyAayaam API. Make sure the Go backend is running." },
      { status: 503 },
    );
  }
}
