import { NextRequest } from "next/server";
import { proxyAuthenticatedRequest } from "@/lib/api-proxy";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const inactive = request.nextUrl.searchParams.get("include_inactive") === "true";
  return proxyAuthenticatedRequest(request, "/api/v1/users" + (inactive ? "?include_inactive=true" : ""), { method: "GET" });
}
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body = await request.json(); } catch { return Response.json({ message: "Please enter valid user details." }, { status: 400 }); }
  return proxyAuthenticatedRequest(request, "/api/v1/users", { method: "POST", body });
}
