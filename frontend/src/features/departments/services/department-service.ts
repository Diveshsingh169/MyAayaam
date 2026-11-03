import type { Department, DepartmentFormValues } from "../types/department";

type DepartmentListResponse = { departments?: Department[]; message?: string };
type DepartmentResponse = { department?: Department; message?: string };

async function readError(response: Response, fallback: string): Promise<Error> {
  try {
    const payload = await response.json();
    return new Error(payload.message || fallback);
  } catch {
    return new Error(fallback);
  }
}

export async function listDepartments(includeInactive: boolean): Promise<Department[]> {
  const response = await fetch("/api/departments?include_inactive=" + includeInactive, { cache: "no-store" });
  if (!response.ok) throw await readError(response, "Unable to load departments.");
  const payload = (await response.json()) as DepartmentListResponse;
  return payload.departments ?? [];
}

export async function saveDepartment(
  values: DepartmentFormValues,
  departmentId?: number,
): Promise<void> {
  const response = await fetch(
    departmentId === undefined ? "/api/departments" : "/api/departments/" + departmentId,
    {
      method: departmentId === undefined ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        description: values.description.trim() || null,
      }),
    },
  );
  if (!response.ok) throw await readError(response, "Unable to save department.");
  await response.json() as DepartmentResponse;
}

export async function setDepartmentActive(department: Department, isActive: boolean): Promise<void> {
  const response = await fetch("/api/departments/" + department.id, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_active: isActive }),
  });
  if (!response.ok) throw await readError(response, "Unable to update department status.");
  await response.json() as DepartmentResponse;
}
