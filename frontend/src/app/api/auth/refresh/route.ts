import { NextRequest, NextResponse } from "next/server";
import {
  backendURL,
  clearAuthCookies,
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  setAuthCookies,
  shouldRemember,
} from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!refreshToken) {
    const response = NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  try {
    const backendResponse = await fetch(backendURL("/api/v1/auth/refresh"), {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    const payload = await backendResponse.json().catch(() => null);

    if (
      !backendResponse.ok ||
      typeof payload?.access_token !== "string" ||
      typeof payload?.refresh_token !== "string"
    ) {
      const response = NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
      clearAuthCookies(response);
      return response;
    }

    const response = NextResponse.json({ message: "Session refreshed." });
    response.headers.set("Cache-Control", "no-store");
    setAuthCookies(
      response,
      { access_token: payload.access_token, refresh_token: payload.refresh_token },
      shouldRemember(request.cookies.get(REMEMBER_COOKIE)?.value),
    );
    return response;
  } catch {
    return NextResponse.json({ message: "Unable to refresh your session right now." }, { status: 503 });
  }
}
