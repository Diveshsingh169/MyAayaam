import { NextRequest } from "next/server";
import { proxyAuthenticatedRequest } from "@/lib/api-proxy";
export const dynamic = "force-dynamic";
type RouteContext = { params: Promise<{ id: string }> };

async function departmentPath(context: RouteContext) {
  const { id } = await context.params;
  return /^[1-9]\d*$/.test(id) ? "/api/v1/departments/" + id : null;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const path = await departmentPath(context);
  if (!path) return Response.json({ message: "Invalid department ID." }, { status: 400 });
  return proxyAuthenticatedRequest(request, path, { method: "GET" });
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const path = await departmentPath(context);
  if (!path) return Response.json({ message: "Invalid department ID." }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ message: "Please enter valid department details." }, { status: 400 }); }
  return proxyAuthenticatedRequest(request, path, { method: "PUT", body });
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const path = await departmentPath(context);
  if (!path) return Response.json({ message: "Invalid department ID." }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); }
  catch { return Response.json({ message: "Please provide a valid status." }, { status: 400 }); }
  return proxyAuthenticatedRequest(request, path, { method: "PATCH", body });
}
