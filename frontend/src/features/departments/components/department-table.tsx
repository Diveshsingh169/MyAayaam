import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import type { Department } from "../types/department";

type DepartmentTableProps = {
  departments: Department[];
  busyId: number | null;
  onEdit: (department: Department) => void;
  onToggle: (department: Department) => void;
};

export default function DepartmentTable({ departments, busyId, onEdit, onToggle }: DepartmentTableProps) {
  return (
    <div className="department-table-wrap">
      <table className="department-table">
        <thead><tr><th>DEPARTMENT</th><th>CODE</th><th>STATUS</th><th>CREATED</th><th className="actions-heading">ACTIONS</th></tr></thead>
        <tbody>
          {departments.map((department) => (
            <tr key={department.id}>
              <td><div className="department-name-cell"><span className="department-row-icon">{department.name.slice(0, 1).toUpperCase()}</span><div><strong>{department.name}</strong><small>{department.description || "No description added"}</small></div></div></td>
              <td><span className="department-code">{department.code}</span></td>
              <td><Badge tone={department.is_active ? "success" : "neutral"} dot>{department.is_active ? "Active" : "Inactive"}</Badge></td>
              <td className="department-date">{new Date(department.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</td>
              <td><div className="department-actions"><Button size="sm" variant="secondary" onClick={() => onEdit(department)}>Edit</Button><Button size="sm" variant={department.is_active ? "danger" : "secondary"} disabled={busyId === department.id} onClick={() => onToggle(department)}>{busyId === department.id ? "Please wait…" : department.is_active ? "Deactivate" : "Activate"}</Button></div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
