export type UserRole = "super_admin" | "department_admin" | "worker";
export type ManagedUser = {
  id: number; name: string; email: string; role: UserRole;
  department_id?: number | null; is_active: boolean; created_at: string; updated_at: string;
};
export type DepartmentOption = { id: number; name: string; code: string; is_active: boolean };
export type CreateUserValues = {
  name: string; email: string; password: string;
  role: "department_admin" | "worker"; department_id: string;
};
export type EditUserValues = { name: string; email: string };
export const emptyCreateUser: CreateUserValues = {
  name: "", email: "", password: "", role: "worker", department_id: "",
};
