import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const hasSession =
    Boolean(request.cookies.get("myaayaam_access")?.value) ||
    Boolean(request.cookies.get("myaayaam_refresh")?.value);

  if (!hasSession) {
    const loginURL = new URL("/", request.url);
    loginURL.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(loginURL);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
