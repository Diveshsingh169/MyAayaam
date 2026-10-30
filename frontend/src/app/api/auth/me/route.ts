import { NextRequest, NextResponse } from "next/server";
import {
  ACCESS_COOKIE,
  backendURL,
  clearAuthCookies,
  REFRESH_COOKIE,
  REMEMBER_COOKIE,
  setAuthCookies,
  shouldRemember,
} from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.json({ message: "Not signed in." }, { status: 401 });
  }

  try {
    let backendResponse: Response | undefined;
    if (accessToken) {
      backendResponse = await fetch(backendURL("/api/v1/auth/me"), {
        headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
    }

    let rotatedTokens: { access_token: string; refresh_token: string } | undefined;

    if ((!backendResponse || backendResponse.status === 401) && refreshToken) {
      const refreshResponse = await fetch(backendURL("/api/v1/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
      const refreshPayload = await refreshResponse.json().catch(() => null);

      if (
        !refreshResponse.ok ||
        typeof refreshPayload?.access_token !== "string" ||
        typeof refreshPayload?.refresh_token !== "string"
      ) {
        const response = NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
        clearAuthCookies(response);
        return response;
      }

      rotatedTokens = {
        access_token: refreshPayload.access_token,
        refresh_token: refreshPayload.refresh_token,
      };
      backendResponse = await fetch(backendURL("/api/v1/auth/me"), {
        headers: { Authorization: `Bearer ${rotatedTokens.access_token}`, Accept: "application/json" },
        cache: "no-store",
        signal: AbortSignal.timeout(10_000),
      });
    }

    if (!backendResponse?.ok) {
      const response = NextResponse.json({ message: "Your session is no longer valid." }, { status: 401 });
      clearAuthCookies(response);
      return response;
    }

    const payload = await backendResponse.json();
    const response = NextResponse.json({ user: payload });
    response.headers.set("Cache-Control", "no-store");

    if (rotatedTokens) {
      setAuthCookies(
        response,
        rotatedTokens,
        shouldRemember(request.cookies.get(REMEMBER_COOKIE)?.value),
      );
    }
    return response;
  } catch {
    return NextResponse.json({ message: "Unable to verify your session. Please try again." }, { status: 503 });
  }
}
