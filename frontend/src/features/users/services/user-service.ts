import type { CreateUserValues, DepartmentOption, EditUserValues, ManagedUser } from "../types/user";
export class UserApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); this.name = "UserApiError"; }
}
async function readError(response: Response, fallback: string): Promise<UserApiError> {
  const text = await response.text();
  if (!text) return new UserApiError(fallback, response.status);
  try {
    const payload = JSON.parse(text) as { message?: string };
    return new UserApiError(payload.message || fallback, response.status);
  } catch {
    return new UserApiError(text.slice(0, 240) || fallback, response.status);
  }
}
export async function listUsers(includeInactive: boolean): Promise<ManagedUser[]> {
  const response = await fetch("/api/users?include_inactive=" + includeInactive, { cache: "no-store" });
  if (!response.ok) throw await readError(response, "Unable to load users.");
  const payload = await response.json() as { users?: ManagedUser[] };
  return payload.users ?? [];
}
export async function listActiveDepartments(): Promise<DepartmentOption[]> {
  const response = await fetch("/api/departments", { cache: "no-store" });
  if (!response.ok) throw await readError(response, "Unable to load departments.");
  const payload = await response.json() as { departments?: DepartmentOption[] };
  return (payload.departments ?? []).filter((item) => item.is_active);
}
export async function createUser(values: CreateUserValues): Promise<void> {
  const body: Record<string, unknown> = {
    name: values.name.trim(), email: values.email.trim(), password: values.password, role: values.role,
  };
  if (values.department_id) body.department_id = Number(values.department_id);
  const response = await fetch("/api/users", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  if (!response.ok) throw await readError(response, "Unable to create user.");
}
export async function updateUser(id: number, values: EditUserValues): Promise<void> {
  const response = await fetch("/api/users/" + id, {
    method: "PUT", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: values.name.trim(), email: values.email.trim() }),
  });
  if (!response.ok) throw await readError(response, "Unable to update user.");
}
export async function setUserActive(id: number, isActive: boolean): Promise<void> {
  const response = await fetch("/api/users/" + id, {
    method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ is_active: isActive }),
  });
  if (!response.ok) throw await readError(response, "Unable to update user status.");
}
