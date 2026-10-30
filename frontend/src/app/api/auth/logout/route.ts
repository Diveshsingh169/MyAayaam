import { NextRequest, NextResponse } from "next/server";
import {
  backendURL,
  clearAuthCookies,
  REFRESH_COOKIE,
} from "@/lib/auth-cookies";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;

  if (refreshToken) {
    try {
      await fetch(backendURL("/api/v1/auth/logout"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
        cache: "no-store",
        signal: AbortSignal.timeout(5_000),
      });
    } catch {
      // Clear the browser session even if the API is temporarily unavailable.
    }
  }

  const response = NextResponse.json({ message: "Signed out." });
  response.headers.set("Cache-Control", "no-store");
  clearAuthCookies(response);
  return response;
}
