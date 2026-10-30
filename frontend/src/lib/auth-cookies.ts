import type { NextResponse } from "next/server";

export const ACCESS_COOKIE = "myaayaam_access";
export const REFRESH_COOKIE = "myaayaam_refresh";
export const REMEMBER_COOKIE = "myaayaam_remember";

const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

export function backendURL(path: string): string {
  const baseURL = (process.env.MYAAYAAM_API_URL || "http://localhost:8080").replace(/\/$/, "");
  return `${baseURL}${path}`;
}

function baseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

export function setAuthCookies(
  response: NextResponse,
  tokens: { access_token: string; refresh_token: string },
  remember: boolean,
) {
  response.cookies.set(ACCESS_COOKIE, tokens.access_token, {
    ...baseCookieOptions(),
    maxAge: 10 * 60,
  });
  response.cookies.set(REFRESH_COOKIE, tokens.refresh_token, {
    ...baseCookieOptions(),
    ...(remember ? { maxAge: REFRESH_MAX_AGE } : {}),
  });

  if (remember) {
    response.cookies.set(REMEMBER_COOKIE, "1", {
      ...baseCookieOptions(),
      maxAge: REFRESH_MAX_AGE,
    });
  } else {
    response.cookies.set(REMEMBER_COOKIE, "0", baseCookieOptions());
  }
}

export function clearAuthCookies(response: NextResponse) {
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE, REMEMBER_COOKIE]) {
    response.cookies.set(name, "", {
      ...baseCookieOptions(),
      expires: new Date(0),
      maxAge: 0,
    });
  }
}

export function shouldRemember(value: string | undefined): boolean {
  return value === "1";
}
