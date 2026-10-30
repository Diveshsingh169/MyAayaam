import { NextRequest, NextResponse } from "next/server";
import { ACCESS_COOKIE, backendURL, REFRESH_COOKIE, REMEMBER_COOKIE, setAuthCookies, shouldRemember } from "@/lib/auth-cookies";

type ProxyOptions = { method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; body?: unknown };

export async function proxyAuthenticatedRequest(request: NextRequest, backendPath: string, options: ProxyOptions) {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  if (!accessToken && !refreshToken) return NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });

  const send = (token: string) => fetch(backendURL(backendPath), {
    method: options.method,
    headers: { Accept: "application/json", ...(options.body === undefined ? {} : { "Content-Type": "application/json" }), Authorization: `Bearer ${token}` },
    ...(options.body === undefined ? {} : { body: JSON.stringify(options.body) }),
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });

  try {
    let backendResponse: Response | undefined;
    if (accessToken) backendResponse = await send(accessToken);
    let rotatedTokens: { access_token: string; refresh_token: string } | undefined;

    if ((!backendResponse || backendResponse.status === 401) && refreshToken) {
      const refreshResponse = await fetch(backendURL("/api/v1/auth/refresh"), {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }), cache: "no-store", signal: AbortSignal.timeout(10_000),
      });
      const refreshPayload = await refreshResponse.json().catch(() => null);
      if (!refreshResponse.ok || typeof refreshPayload?.access_token !== "string" || typeof refreshPayload?.refresh_token !== "string") {
        return NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
      }
      rotatedTokens = { access_token: refreshPayload.access_token, refresh_token: refreshPayload.refresh_token };
      backendResponse = await send(rotatedTokens.access_token);
    }

    if (!backendResponse) return NextResponse.json({ message: "Your session has expired. Please sign in again." }, { status: 401 });
    const responseText = await backendResponse.text();
    let responseBody: unknown;
    try { responseBody = responseText ? JSON.parse(responseText) : {}; }
    catch { responseBody = { message: responseText || "The API returned an invalid response." }; }
    const response = NextResponse.json(responseBody, { status: backendResponse.status });
    response.headers.set("Cache-Control", "no-store");
    if (rotatedTokens) setAuthCookies(response, rotatedTokens, shouldRemember(request.cookies.get(REMEMBER_COOKIE)?.value));
    return response;
  } catch {
    return NextResponse.json({ message: "Unable to reach MyAayaam API. Please try again." }, { status: 503 });
  }
}
